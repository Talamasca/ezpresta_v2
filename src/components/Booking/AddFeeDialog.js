import React, { useState } from "react";
import { useSnackbar } from "notistack";

import EuroIcon from "@mui/icons-material/Euro";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField
} from "@mui/material";

export default function AddFeeDialog({ onAddFee }) {
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = useState(false);
  const [feeName, setFeeName] = useState("");
  const [feeAmount, setFeeAmount] = useState("");

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (feeName && feeAmount) {
      const newFee = {
        feeName,
        feeAmount: parseFloat(feeAmount)
      };
      onAddFee(newFee);
      enqueueSnackbar("Le frais a été ajouté avec succès", {
        variant: "success"
      });
      handleClose();
    } else {
      enqueueSnackbar("Veuillez remplir tous les champs", {
        variant: "warning"
      });
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        onClick={ handleOpen }
        startIcon={ <EuroIcon /> }
        size="small"
      >
        Ajouter des frais supplémentaires
      </Button>

      <Dialog open={ open } onClose={ handleClose }>
        <DialogTitle>Ajouter des frais</DialogTitle>
        <DialogContent>
          <form onSubmit={ handleSubmit }>
            <TextField
              id="feeName"
              label="Type de frais"
              value={ feeName }
              onChange={ e => setFeeName(e.target.value) }
              margin="normal"
              type="text"
              fullWidth
            />
            <TextField
              id="feeAmount"
              label="Montant du frais (en euros)"
              value={ feeAmount }
              onChange={ e => setFeeAmount(e.target.value) }
              margin="normal"
              type="number"
              fullWidth
              InputProps={ {
                endAdornment: <EuroIcon />
              } }
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={ handleClose } color="primary">
            Annuler
          </Button>
          <Button onClick={ handleSubmit } color="primary">
            Valider
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
