import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Dialog,
  Paper,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import WorkflowForm from "./WorkflowForm"; // Le formulaire à afficher dans la modal

const WorkflowList = () => {
  const [workflows, setWorkflows] = useState([]);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);

  useEffect(() => {
    const fetchWorkflows = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const workflowsCollection = collection(db, `users/${userId}/workflows`);
        const workflowSnapshot = await getDocs(workflowsCollection);
        const workflowList = workflowSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          tasksCount:
            doc.data().tasks && doc.data().tasks.length > 0
              ? doc.data().tasks.length
              : 0,
          ...doc.data(),
        }));
        setWorkflows(workflowList);
      }
    };

    fetchWorkflows();
  }, []);

  const handleAddWorkflow = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user && newWorkflowName) {
      const userId = user.uid;
      await addDoc(collection(db, `users/${userId}/workflows`), {
        name: newWorkflowName,
        tasks: [],
      });
      setNewWorkflowName("");
      // Rafraîchir la liste après l'ajout
      const workflowSnapshot = await getDocs(
        collection(db, `users/${userId}/workflows`)
      );
      const workflowList = workflowSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWorkflows(workflowList);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      await deleteDoc(doc(db, `users/${userId}/workflows`, id));
      setWorkflows(workflows.filter((workflow) => workflow.id !== id));
    }
  };

  const handleEditWorkflow = (workflowId) => {
    setSelectedWorkflowId(workflowId);
    setOpenModal(true); // Ouvrir la modal
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedWorkflowId(null); // Réinitialiser la sélection
  };

  return (
    <div>
      <h2>Workflows existants</h2>
      <Paper elevation={3} style={{ padding: "20px", marginBottom: "20px" }}>
        <List>
          {workflows.map((workflow) => (
            <>
              <ListItem key={workflow.id}>
                <ListItemText
                  primary={`${workflow.name} - ${workflow.tasksCount} tâche(s)`}
                />
                <IconButton
                  edge="end"
                  onClick={() => handleEditWorkflow(workflow.id)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteWorkflow(workflow.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
              <Divider />
            </>
          ))}
        </List>
      </Paper>

      <div style={{ marginBottom: "20px" }}>
        <TextField
          label="Nouveau Workflow"
          value={newWorkflowName}
          onChange={(e) => setNewWorkflowName(e.target.value)}
          fullWidth
        />
        <Button
          onClick={handleAddWorkflow}
          variant="contained"
          style={{ marginTop: "10px" }}
        >
          Ajouter Workflow
        </Button>
      </div>

      {/* Modal pour l'édition d'un workflow */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
      >
        {selectedWorkflowId && (
          <WorkflowForm
            workflowId={selectedWorkflowId}
            onClose={handleCloseModal}
          />
        )}
      </Dialog>
    </div>
  );
};

export default WorkflowList;
