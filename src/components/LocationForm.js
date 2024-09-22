// components/LocationForm.jsx
import React, { useState } from "react";
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
import useLoadScript from "../hooks/useLoadScript";

function LocationForm({ selectedDate, onClose, onSave }) {
  const [eventDate, setEventDate] = useState(selectedDate || new Date());
  const [eventName, setEventName] = useState("");
  const [place, setPlace] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const scriptLoaded = useLoadScript(
    `https://maps.googleapis.com/maps/api/js?key=AIzaSyCYVIg1bNAfhwm7CaHjnWo5RApHWgoG6FY&libraries=places&language=fr`
  );

  const fetchPlaces = (request, callback) => {
    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(request, callback);
  };

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);

    if (newInputValue && scriptLoaded) {
      setLoading(true);
      fetchPlaces(
        {
          input: newInputValue,
          types: ["geocode"],
          componentRestrictions: { country: "fr" },
        },
        (results) => {
          setOptions(results || []);
          setLoading(false);
        }
      );
    } else {
      setOptions([]);
    }
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
              onChange={(newValue) => {
                setEventDate(newValue);
              }}
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
            onChange={(event, newValue) => {
              setPlace(newValue);
            }}
            onInputChange={handleInputChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Lieu"
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
