import React, { useEffect, useState } from "react";
import { useSnackbar } from "notistack";

import AssignmentIcon from "@mui/icons-material/Assignment"; // Icône pour les tâches
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip
} from "@mui/material";
import Badge from "@mui/material/Badge"; // Importation de Badge de Material-UI pour le compteur
import { styled } from "@mui/material/styles"; // Importation pour styliser le Badge
import { doc, getDoc, updateDoc } from "firebase/firestore";

import { useAuth } from "../contexts/AuthContext"; // Contexte pour récupérer currentUser
import { db } from "../firebase"; // Firebase Firestore instance


const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: -3,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: "0 4px"
  }
}));

export default function ReservationTodo({ reservation }) {
  const { currentUser } = useAuth(); // Récupérer l'utilisateur connecté
  const [tasks, setTasks] = useState(reservation.workflow?.tasks || []); 
  const [newTaskLabel, setNewTaskLabel] = useState(""); // État pour le texte de la nouvelle tâche
  const [openTaskManager, setOpenTaskManager] = useState(false);
  const [openTaskDetails, setOpenTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [comment, setComment] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const userId = currentUser.uid; // Utiliser l'ID de l'utilisateur connecté
  const orderId = reservation.id; // ID de la commande

  // Recharger les tâches depuis Firestore pour s'assurer d'avoir la version la plus récente
  const refreshTasksFromFirestore = async () => {
    const orderDocRef = doc(db, `users/${userId}/orders/${orderId}`);
    const orderDoc = await getDoc(orderDocRef);

    if (orderDoc.exists()) {
      const workflowData = orderDoc.data().workflow;
      if (workflowData && workflowData.tasks) {
        setTasks(workflowData.tasks); // Charger les tâches depuis Firestore
      } else {
        enqueueSnackbar("Aucune tâche trouvée dans le workflow", { variant: "info" });
      }
    } else {
      enqueueSnackbar("Le document de la commande n'existe pas", { variant: "error" });
    }
  };

  const handleAddTask = async () => {
    if (!newTaskLabel.trim()) {
      enqueueSnackbar("Le nom de la tâche ne peut pas être vide", { variant: "warning" });
      return;
    }

    const newTask = {
      label: newTaskLabel,
      done: false,
      dateDone: null,
      comment: ""
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks); // Mise à jour de l'état local
    setNewTaskLabel(""); // Réinitialise le champ de saisie

    const orderDocRef = doc(db, `users/${userId}/orders/${orderId}`);
    await updateDoc(orderDocRef, { "workflow.tasks": updatedTasks });

    enqueueSnackbar("Tâche ajoutée avec succès", { variant: "success" });
  };

  useEffect(() => {
    refreshTasksFromFirestore(); // Charger les tâches lors du montage initial du composant
  }, []);

  // Gérer l'ouverture du gestionnaire de tâches
  const handleOpenTaskManager = () => {
    setOpenTaskManager(true);
  };

  const handleCloseTaskManager = () => {
    setOpenTaskManager(false);
  };

  // Gérer l'ouverture de la fenêtre de détails de la tâche
  const handleClickOpenTaskDetails = task => {
    setSelectedTask(task);
    setComment(task.comment || "");
    setOpenTaskDetails(true);
  };

  const handleCloseTaskDetails = () => {
    setOpenTaskDetails(false);
    setSelectedTask(null);
  };

  // Cochez/Décochez une tâche
  const handleCheckTask = async taskIndex => {
    const updatedTasks = tasks.map((task, index) =>
      index === taskIndex ? { ...task, done: !task.done, dateDone: !task.done ? new Date().toISOString() : null } : task
    );

    setTasks(updatedTasks); // Mettre à jour localement

    // Mettre à jour Firestore uniquement avec le tableau modifié
    const orderDocRef = doc(db, `users/${userId}/orders/${orderId}`);
    await updateDoc(orderDocRef, { "workflow.tasks": updatedTasks });

    enqueueSnackbar(`Tâche ${tasks[taskIndex].done ? "réactivée" : "accomplie"}!`, { variant: "success" });
  };

  // Enregistrer un commentaire pour une tâche
  const handleSaveComment = async () => {
    const updatedTasks = tasks.map(task =>
      task === selectedTask ? { ...task, comment } : task
    );

    setTasks(updatedTasks); // Mettre à jour localement

    const orderDocRef = doc(db, `users/${userId}/orders/${orderId}`);
    await updateDoc(orderDocRef, { "workflow.tasks": updatedTasks }); // Mettre à jour Firestore

    enqueueSnackbar("Commentaire ajouté !", { variant: "success" });
    handleCloseTaskDetails();
  };

  const handleDeleteTask = async taskIndex => {
    // Filtrer la tâche à supprimer
    const updatedTasks = tasks.filter((_, index) => index !== taskIndex);
    
    // Mettre à jour localement
    setTasks(updatedTasks);

    // Mettre à jour Firebase avec le tableau modifié
    const orderDocRef = doc(db, `users/${userId}/orders/${orderId}`);
    await updateDoc(orderDocRef, { "workflow.tasks": updatedTasks });

    enqueueSnackbar("Tâche supprimée avec succès", { variant: "success" });
  };

  const countTask = () => {
    let counter = 0;
    tasks.forEach(task => {
      if (!task.done) {
        counter += 1;
      }
    });
    return counter;
  };

  return (
    <>
      { /* Bouton pour ouvrir le gestionnaire de tâches */ }
      <Tooltip title="Gérer les tâches">
        <IconButton onClick={ handleOpenTaskManager }>
          <StyledBadge badgeContent={ countTask() } color="secondary">
            <AssignmentIcon color="primary" />
          </StyledBadge>
        </IconButton>
      </Tooltip>

      { /* Fenêtre modale pour afficher les tâches */ }
      <Dialog open={ openTaskManager } onClose={ handleCloseTaskManager } fullWidth maxWidth="sm">
        <DialogTitle>Liste des tâches sur cette prestation</DialogTitle>
        <DialogContent>
          <TableContainer component={ Paper }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Todo</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { tasks.map((task, index) => (
                  <TableRow key={ index } style={ task.done ? { textDecorationLine: "line-through" } : {} }>
                    <TableCell>{ index + 1 }</TableCell>
                    <TableCell>{ task.label }</TableCell>
                    <TableCell>
                      { /* Cocher/Décocher la tâche */ }
                      <Tooltip title={ task.done ? "Réactiver la tâche" : "Marquer comme accompli" }>
                        <Checkbox
                          checked={ task.done }
                          onChange={ () => handleCheckTask(index) }
                          icon={ <CheckCircleIcon /> }
                          checkedIcon={ <CheckCircleIcon color="success" /> }
                        />
                      </Tooltip>
                      { /* Modifier la tâche / Ajouter un commentaire */ }
                      <Tooltip title="Ajouter un commentaire">
                        <IconButton onClick={ () => handleClickOpenTaskDetails(task) }>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      { /* Supprimer la tâche */ }
                      <Tooltip title="Supprimer la tâche">
                        <IconButton onClick={ () => handleDeleteTask(index) } color="secondary">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>
          { /* Champ de saisie pour la nouvelle tâche */ }
          <TextField
            fullWidth
            variant="outlined"
            label="Nouvelle tâche"
            value={ newTaskLabel }
            onChange={ e => setNewTaskLabel(e.target.value) }
            margin="dense"
          />
          <Button onClick={ handleAddTask } color="primary" variant="contained" style={ { marginTop: 8 } }>
            Ajouter la tâche
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={ handleCloseTaskManager } color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      { /* Fenêtre de dialogue pour afficher et ajouter un commentaire */ }
      <Dialog open={ openTaskDetails } onClose={ handleCloseTaskDetails }>
        <DialogTitle>Détails de la tâche</DialogTitle>
        <DialogContent>
          <p>
            <strong>Nom :</strong> { selectedTask?.label }
          </p>
          <p>
            <strong>Date d'accomplissement :</strong> {
              new Date(
                selectedTask?.dateDone
              ).toLocaleString("fr-FR", {
                year: "numeric",
                month: "numeric",
                day: "numeric"
              })            
            || "Non accomplie" }
          </p>
          <TextField
            fullWidth
            margin="dense"
            label="Commentaire"
            multiline
            rows={ 3 }
            value={ comment }
            onChange={ e => setComment(e.target.value) }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={ handleCloseTaskDetails } color="primary">
            Annuler
          </Button>
          <Button onClick={ handleSaveComment } color="secondary">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
