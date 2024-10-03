// components/LocationForm.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  TextField,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import frLocale from "date-fns/locale/fr";
import throttle from "lodash/throttle";
import parse from "autosuggest-highlight/parse";
import { Grid, Typography } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Box from "@mui/material/Box";

function loadScript(src, position, id) {
  if (!position) {
    return;
  }

  const script = document.createElement("script");
  script.setAttribute("async", "");
  script.setAttribute("id", id);
  script.src = src;
  position.appendChild(script);
}

let autocompleteService = { current: null };

function LocationForm({ selectedDate, onClose, onSave }) {
  const [eventDate, setEventDate] = useState(selectedDate || new Date());
  const [eventName, setEventName] = useState("");
  const [place, setPlace] = useState(null);
  const [getPlaceId, setPlaceId] = React.useState({});

  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);

  // Optimized load script logic for Google Maps API
  useEffect(() => {
    if (typeof window !== "undefined" && !loaded.current) {
      if (!document.querySelector("#google-maps")) {
        loadScript(
          `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`,
          document.querySelector("head"),
          "google-maps"
        );
      }
      loaded.current = true;
    }
  }, []);

  // Throttling API requests for better performance
  const fetch = useMemo(
    () =>
      throttle((input, callback) => {
        autocompleteService.current.getPlacePredictions(input, callback);
      }, 200),
    []
  );

  useEffect(() => {
    let active = true;

    if (!autocompleteService.current && window.google) {
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
    }

    if (!autocompleteService.current) {
      return undefined;
    }

    if (inputValue === "") {
      setOptions([]);
      return undefined;
    }

    setLoading(true);
    fetch(
      {
        input: inputValue,
        //types: ["geocode"],
        //componentRestrictions: { country: "fr" },
      },
      (results) => {
        if (active) {
          setOptions(results || []);
          setLoading(false);
        }
      }
    );

    return () => {
      active = false;
    };
  }, [inputValue, fetch]);

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ eventDate, eventName, place });
    onClose();
  };

  return (
    <>
      <DialogTitle>Ajouter un nouveau lieu</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={frLocale}
          >
            <DateTimePicker
              label="Date et heure"
              value={eventDate}
              onChange={(newValue) => setEventDate(newValue)}
              renderInput={(params) => (
                <TextField {...params} fullWidth margin="normal" />
              )}
            />
          </LocalizationProvider>
          <TextField
            label="Événement"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Autocomplete
            freeSolo
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.description
            }
            filterOptions={(x) => x}
            options={options}
            autoComplete
            includeInputInList
            filterSelectedOptions
            value={place}
            onChange={(event, value) => {
              if (value) {
                setPlaceId(value);
                setPlace(value);
              }
            }}
            onInputChange={handleInputChange}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              const matches =
                option.structured_formatting.main_text_matched_substrings || [];

              const parts = parse(
                option.structured_formatting.main_text,
                matches.map((match) => [
                  match.offset,
                  match.offset + match.length,
                ])
              );
              return (
                <li key={key} {...optionProps}>
                  <Grid container sx={{ alignItems: "center" }}>
                    <Grid item sx={{ display: "flex", width: 44 }}>
                      <LocationOnIcon sx={{ color: "text.secondary" }} />
                    </Grid>
                    <Grid
                      item
                      sx={{
                        width: "calc(100% - 44px)",
                        wordWrap: "break-word",
                      }}
                    >
                      {parts.map((part, index) => (
                        <Box
                          key={index}
                          component="span"
                          sx={{
                            fontWeight: part.highlight ? "bold" : "regular",
                          }}
                        >
                          {part.text}
                        </Box>
                      ))}
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        {option.structured_formatting.secondary_text}
                      </Typography>
                    </Grid>
                  </Grid>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Lieu"
                name="Location"
                variant="outlined"
                fullWidth
                margin="normal"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Enregistrer
        </Button>
      </DialogActions>
    </>
  );
}

export default LocationForm;
