import { useState, useEffect } from "react";
import { IconButton, Badge, Button, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableRow, Tooltip } from "@mui/material";
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, GetApp as GetAppIcon } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext"; // Pour récupérer currentUser

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
  },
}));

export default function ReservationUpload({ reservation }) {
  const { currentUser } = useAuth(); // Récupérer l'utilisateur connecté
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);

  const reservationId = reservation.id; // ID de la réservation
  const userId = currentUser.uid; // ID de l'utilisateur connecté
  const storagePath = `${userId}/booking/${reservationId}`; // Chemin de stockage dans Firebase Storage
  const storage = getStorage(); // Instance Firebase Storage

  useEffect(() => {
    fetchFiles(); // Récupérer les fichiers dès le chargement du composant
  }, []);

  // Fonction pour ouvrir la fenêtre de dialogue
  const handleClickOpen = () => {
    setOpen(true);
  };

  // Fonction pour fermer la fenêtre de dialogue
  const handleClose = () => {
    if (progress !== 0) {
      enqueueSnackbar("Veuillez attendre la fin de l'upload", { variant: "warning" });
      return;
    }
    setOpen(false);
  };

  // Fonction pour gérer l'upload d'un fichier
  const uploadFile = (file) => {
    if (file.size / 1024 / 1024 > 5) {
      enqueueSnackbar("La taille du fichier est trop grande", { variant: "warning" });
      return;
    }

    setLoading(true);
    const fileRef = ref(storage, `${storagePath}/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(progress);
      },
      (error) => {
        setLoading(false);
        enqueueSnackbar(error.message, { variant: "error" });
      },
      () => {
        setLoading(false);
        setProgress(0);
        enqueueSnackbar("Fichier uploadé avec succès", { variant: "success" });
        fetchFiles(); // Récupérer les fichiers après l'upload
      }
    );
  };

  // Fonction pour récupérer les fichiers
  const fetchFiles = async () => {
    const filesRef = ref(storage, storagePath);
    try {
      const result = await listAll(filesRef);
      setFiles(result.items);
    } catch (error) {
      enqueueSnackbar("Erreur lors de la récupération des fichiers", { variant: "error" });
    }
  };

  // Fonction pour télécharger un fichier
  const downloadFile = async (file) => {
    const fileRef = ref(storage, `${storagePath}/${file.name}`);
    try {
      const url = await getDownloadURL(fileRef);
      window.open(url);
    } catch (error) {
      enqueueSnackbar("Erreur lors du téléchargement du fichier", { variant: "error" });
    }
  };

  // Fonction pour supprimer un fichier
  const deleteFile = async (file) => {
    const fileRef = ref(storage, `${storagePath}/${file.name}`);
    try {
      await deleteObject(fileRef);
      enqueueSnackbar("Fichier supprimé avec succès", { variant: "success" });
      fetchFiles(); // Récupérer les fichiers après la suppression
    } catch (error) {
      enqueueSnackbar("Erreur lors de la suppression du fichier", { variant: "error" });
    }
  };

  return (
    <>
      <Tooltip title="Upload">
        <IconButton onClick={handleClickOpen}>
          <StyledBadge badgeContent={files.length || 0} color="secondary">
            <CloudUploadIcon />
          </StyledBadge>
        </IconButton>
      </Tooltip>

      {/* Dialog pour l'upload */}
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle>Uploader un fichier</DialogTitle>
        <DialogContent>
          <Table>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.name}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => downloadFile(file)}>
                      <GetAppIcon />
                    </IconButton>
                    <IconButton onClick={() => deleteFile(file)} color="secondary">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" component="label" disabled={loading}>
            {progress !== 0 ? `Upload en cours : ${progress}%` : "Upload un fichier"}
            <input type="file" onChange={(e) => uploadFile(e.target.files[0])} hidden />
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}