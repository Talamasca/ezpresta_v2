import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";

const WorkflowForm = ({ workflowId, onClose }) => {
  const [workflowName, setWorkflowName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [editTaskId, setEditTaskId] = useState(null);
  const [editedTaskLabel, setEditedTaskLabel] = useState("");

  useEffect(() => {
    const fetchWorkflow = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const workflowRef = doc(db, `users/${userId}/workflows`, workflowId);
        const workflowDoc = await getDoc(workflowRef);
        if (workflowDoc.exists()) {
          const data = workflowDoc.data();
          setWorkflowName(data.name);
          setTasks(data.tasks || []);
        }
      }
    };

    if (workflowId) fetchWorkflow();
  }, [workflowId]);

  const handleAddTask = () => {
    if (newTask) {
      setTasks([...tasks, { id: Date.now(), label: newTask, done: false }]);
      setNewTask("");
    }
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const handleEditTask = (taskId, taskLabel) => {
    setEditTaskId(taskId);
    setEditedTaskLabel(taskLabel);
  };

  const handleSaveEditedTask = () => {
    setTasks(
      tasks.map((task) =>
        task.id === editTaskId ? { ...task, label: editedTaskLabel } : task
      )
    );
    setEditTaskId(null);
    setEditedTaskLabel("");
  };

  const handleSave = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const workflowRef = doc(db, `users/${userId}/workflows`, workflowId);
      await updateDoc(workflowRef, {
        name: workflowName,
        tasks: tasks,
      });
      onClose(); // Fermer la modal après sauvegarde
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Éditer Workflow</h2>
      <TextField
        label="Nom du Workflow"
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Nouvelle tâche"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button
        onClick={handleAddTask}
        variant="contained"
        style={{ marginBottom: "20px", marginTop: "10px" }}
      >
        Ajouter Tâche
      </Button>

      {/* Tableau des tâches */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tâche</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                {editTaskId === task.id ? (
                  <TextField
                    value={editedTaskLabel}
                    onChange={(e) => setEditedTaskLabel(e.target.value)}
                    fullWidth
                  />
                ) : (
                  task.label
                )}
              </TableCell>
              <TableCell align="right">
                {editTaskId === task.id ? (
                  <IconButton onClick={handleSaveEditedTask}>
                    <CheckIcon />
                  </IconButton>
                ) : (
                  <>
                    <IconButton
                      onClick={() => handleEditTask(task.id, task.label)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteTask(task.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DialogActions style={{ marginTop: "20px" }}>
        <Button onClick={handleSave} variant="contained" color="primary">
          Sauvegarder Workflow
        </Button>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Annuler
        </Button>
      </DialogActions>
    </div>
  );
};

export default WorkflowForm;
