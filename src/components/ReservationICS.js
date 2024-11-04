import React, { useState } from "react";
import ICalendarLink from "react-icalendar-link";

import EventIcon from "@mui/icons-material/Event";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";

// Le composant accepte l'objet reservation comme prop
export default function ReservationICS({ reservation }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const calcEndTime = (start, duration) => {
    let endTime = new Date(start);
    endTime.setHours(endTime.getHours() + duration);
    return endTime;
  };

  const filename = `EZPresta-${reservation.productType}-${reservation.clientName}.ics`;
  const removeHour = value => value.split("T")[0];

  const event = {
    title: `EZPresta : ${reservation.productType} - ${reservation.clientName}`,
    description: `Prestation avec ${reservation.clientName}`,
    startTime: reservation.selectedDate,
    endTime: calcEndTime(reservation.selectedDate, 8), // Durée de 8 heures
    location: reservation.locations[0]?.locationWhere || "Lieu non défini"
  };

  const eventAllDay = {
    title: `EZPresta : ${reservation.productType} - ${reservation.clientName}`,
    description: `Prestation avec ${reservation.clientName}`,
    startTime: removeHour(reservation.selectedDate),
    location: reservation.locations[0]?.locationWhere || "Lieu non défini"
  };

  const getEvent = () => (reservation.catalogDuration === 24 
    ? eventAllDay 
    : event);

  const addTimeToDate = (date, hours, minutes) => {
    date.setHours(date.getHours() + hours);
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  };

  // Contenu brut personnalisé, par exemple pour ajouter un rappel 15 minutes avant l'événement
  const rawContent =
    "BEGIN:VALARM TRIGGER:-PT15M DURATION:PT15M ACTION:DISPLAY END:VALARM";

  const makeGoogleLink = () => {
    let start = new Date(reservation.selectedDate).toISOString().replace(/\.|:|-/g, "");
    let duration = 8; // Par défaut 8h
    let end = addTimeToDate(new Date(reservation.selectedDate), duration, 0)
      .toISOString()
      .replace(/\.|:|-/g, "");
    let location = reservation.locations[0]?.locationWhere || "Lieu non défini";
    let title = `EZPresta : ${reservation.productType} - ${reservation.clientName}`;

    let link = `https://calendar.google.com/calendar/u/0/r/eventedit?dates=${start}/${end}&location=${location}&text=${title}`;
    window.open(link, "_blank", "noopener,noreferrer");
    handleClose();
  };

  return (
    <>
      <Tooltip title="Exporter dans votre calendrier">
        <IconButton onClick={ handleClick } color="primary">
          <EventIcon />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={ anchorEl } open={ Boolean(anchorEl) } onClose={ handleClose }>
        { /* Lien vers Google Calendar */ }
        <MenuItem onClick={ makeGoogleLink }>Google Calendar</MenuItem>
        <ICalendarLink filename={ filename } event={ event } rawContent={ rawContent } 
          style={ { textDecoration: "none", color: "inherit" } }>
          <MenuItem onClick={ handleClose }>ICS</MenuItem>
        </ICalendarLink>
      </Menu>
    </>
  );
}
