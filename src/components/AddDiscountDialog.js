import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useSnackbar } from "notistack";
import EuroIcon from "@mui/icons-material/Euro";

export default function AddDiscountDialog({ onAddDiscount }) {
  //const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [discountName, setDiscountName] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [isPercentage, setIsPercentage] = useState(false); // Toggle between € and %

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (discountName && discountAmount) {
      const newDiscount = {
        discountName,
        discountAmount: parseFloat(discountAmount),
        isPercentage,
      };
      onAddDiscount(newDiscount);
      enqueueSnackbar("La remise a été ajoutée avec succès", {
        variant: "success",
      });
      handleClose();
    } else {
      enqueueSnackbar("Veuillez remplir tous les champs", {
        variant: "warning",
      });
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        onClick={handleOpen}
        startIcon={<EuroIcon />}
        size="small"
      >
        Ajouter une remise
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Ajouter une remise</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <TextField
              id="discountName"
              label="Nom de la réduction"
              value={discountName}
              onChange={(e) => setDiscountName(e.target.value)}
              margin="normal"
              fullWidth
            />
            <TextField
              id="discountAmount"
              label={`Montant de la remise (${isPercentage ? "%" : "€"})`}
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              margin="normal"
              type="number"
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isPercentage}
                  onChange={() => setIsPercentage(!isPercentage)}
                  color="primary"
                />
              }
              label="Remise en pourcentage"
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Annuler
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Valider
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
