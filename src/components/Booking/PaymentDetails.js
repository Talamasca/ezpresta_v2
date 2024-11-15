// PaymentDetails.js
import React, { useEffect,useState } from "react";
import { format } from "date-fns";

import { Button,Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";

const PaymentDetails = ({
  reservationData,
  paymentPlan,
  setPaymentPlan,
  paymentPercentages,
  setPaymentPercentages,
  paymentValues,
  setPaymentValues,
  totalPrice,
  handleRecalculate,
  isEditing
}) => {
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    if (isEditing && reservationData.paymentDetails) {
      const updatedPercentages = reservationData.paymentDetails.map(payment =>
        ((payment.value / totalPrice) * 100).toFixed(2)
      );
      setPaymentPercentages(updatedPercentages);
      const updatedValues = reservationData.paymentDetails.map(payment => payment.value);
      setPaymentValues(updatedValues);
    }
  }, [isEditing, reservationData, setPaymentPercentages, setPaymentValues, totalPrice]);

  const handlePaymentPlanChange = e => {
    const selectedPlan = e.target.value;
    setPaymentPlan(selectedPlan);

    let updatedPercentages;
    if (selectedPlan === "2x") {
      updatedPercentages = [50, 50];
    } else if (selectedPlan === "3x") {
      updatedPercentages = [30, 50, 20];
    } else {
      updatedPercentages = [100];
    }

    setPaymentPercentages(updatedPercentages);
    setPaymentValues(updatedPercentages.map(pct => (totalPrice * pct) / 100));
  };

  return (
    <div>
      <Typography variant="h6" sx={{ fontWeight: 500, fontSize: "1.2rem", mb: 2 }}>
        Paiement en plusieurs fois
      </Typography>
      <TextField
        select
        label="Plan de paiement"
        value={paymentPlan}
        onChange={handlePaymentPlanChange}
        fullWidth
        sx={{ mb: 2 }}
      >
        <option value="Non">Non</option>
        <option value="2x">2x</option>
        <option value="3x">3x</option>
      </TextField>
      {paymentPlan !== "Non" && (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Paiement n°</TableCell>
                  <TableCell>Répartition en %</TableCell>
                  <TableCell>Montant en €</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentPercentages.map((percentage, index) => (
                  <TableRow key={index}>
                    <TableCell>{`n°${index + 1}`}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={percentage}
                        onChange={e => {
                          const newPercentages = [...paymentPercentages];
                          newPercentages[index] = parseInt(e.target.value, 10);
                          setPaymentPercentages(newPercentages);
                        }}
                        disabled={
                          isEditing &&
                          reservationData.paymentDetails &&
                          reservationData.paymentDetails[index].isPaid
                        }
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      {isEditing &&
                      reservationData.paymentDetails &&
                      reservationData.paymentDetails[index].isPaid ? (
                        <Typography variant="caption" color="textSecondary">
                            {reservationData.paymentDetails[index].value} € (Réglé le{" "}
                            {format(
                              new Date(reservationData.paymentDetails[index].paymentDate),
                              "dd/MM/yyyy"
                            )}
                            )
                          </Typography>
                        ) : (
                          <TextField
                            type="number"
                            value={paymentValues[index]}
                            onChange={e => {
                              const newValues = [...paymentValues];
                              newValues[index] = parseFloat(e.target.value);
                              setPaymentValues(newValues);
                            }}
                            fullWidth
                          />
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button variant="contained" color="primary" onClick={handleRecalculate} sx={{ mt: 2 }}>
            Recalculer la répartition
          </Button>
          {paymentError && (
            <Typography color="error" style={{ marginTop: "10px" }}>
              {paymentError}
            </Typography>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentDetails;
