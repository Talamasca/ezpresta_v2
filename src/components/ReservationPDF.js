import React, { useEffect, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";


const PDFInvoiceGenerator = ({ reservation, type }) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [catalogData, setCatalogData] = useState(null);
  const [clientData, setClientData] = useState(null); // Nouvel état pour les données client


  useEffect(() => {
    const fetchUserData = async () => {
      const userDocRef = doc(db, `users/${currentUser.uid}`);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    };

    const fetchCatalogData = async () => {
      const catalogDocRef = doc(db, `users/${currentUser.uid}/catalog/${reservation.catalog_id}`);
      const catalogDoc = await getDoc(catalogDocRef);
      if (catalogDoc.exists()) {
        setCatalogData(catalogDoc.data());
      }
    };

    const fetchClientData = async () => {
      const clientDocRef = doc(db, `users/${currentUser.uid}/customers/${reservation.client_id}`);
      const clientDoc = await getDoc(clientDocRef);
      if (clientDoc.exists()) {
        setClientData(clientDoc.data());
      }
    };

    fetchUserData();
    fetchCatalogData();
    fetchClientData();
  }, [currentUser.uid, reservation.catalog_id, reservation.client_id]);


 // Fonction pour téléverser le fichier PDF dans Firebase Storage
  const uploadPDFToStorage = async (pdfBlob, fileName, docNumber) => {
    try {
      const storage = getStorage();
      const pdfPath = `${currentUser.uid}/booking/${reservation.id}/${fileName}`;
      const pdfRef = ref(storage, pdfPath);

      // Téléversement dans Firebase Storage
      await uploadBytes(pdfRef, pdfBlob);

      // Mise à jour du numéro de devis ou facture dans Firestore
      const userDocRef = doc(db, `users/${currentUser.uid}`);
      await updateDoc(userDocRef, {
        [type === "facture" ? "invoice" : "quote"]: docNumber + 1,
      });

      console.log(`PDF ${fileName} stocké dans Firebase Storage à ${pdfPath}`);
    } catch (error) {
      console.error("Erreur lors de l'upload du PDF dans Firebase Storage :", error);
    }
  };

const generatePDF = async () => {
  if (!userData || !catalogData) return;

    const pdf = new jsPDF();
    const today = new Date().toLocaleDateString("fr-FR");
    let docNumber = type === "facture" ? userData.invoice : userData.quote;
    let version = 1;

    // Récupération du numéro de version actuel et mise à jour pour l'incrémenter
    const orderDocRef = doc(db, `users/${currentUser.uid}/orders/${reservation.id}`);
    const orderDoc = await getDoc(orderDocRef);

    if (orderDoc.exists()) {
      const orderData = orderDoc.data();
      const lastVersion = orderData[`${type}_version`] || 0;
      version = lastVersion + 1;
      await updateDoc(orderDocRef, { [`${type}_version`]: version });
    } else {
      await setDoc(orderDocRef, { [`${type}_version`]: version });
    }

    const fileName = `${type === "facture" ? "Facture" : "Devis"}_${docNumber}-${version}.pdf`;

  // En-tête du document
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text(`${type === "facture" ? "FACTURE" : "DEVIS"} n° ${docNumber}`, 10, 10);

  // Positionner la date en haut à droite
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(`DATE : ${today}`, 200, 10, { align: "right" });

    // Logo (centré, avec proportions conservées)
    if (userData.logo) {
    const img = new Image();
    img.src = userData.logo;
    
    // Taille du logo en pixels
    const logoWidth = 60; // Largeur souhaitée
    const centerX = (210 - logoWidth) / 2; // Calcul pour centrer (largeur de page A4 = 210mm)
    
    pdf.addImage(img, "JPEG", centerX, 20, logoWidth, 0); // Hauteur ajustée automatiquement avec `0`
    }

  // Informations de l'utilisateur (compact, à gauche)
  pdf.setFontSize(10);
  let startY = 70;
  if (userData) {
    pdf.text(`${userData.company}`, 10, startY);
    pdf.text(`${userData.address}`, 10, startY + 5);
    pdf.text(`SIRET : ${userData.siret}`, 10, startY + 10);
    pdf.text(`Tel : ${userData.tel}`, 10, startY + 15);
    pdf.text(`Site : ${userData.url}`, 10, startY + 20);
  }

  // Informations Client (compact, complètement aligné à droite)
  if (clientData) {
    const clientX = 150; // Position X pour les informations du client à droite
    pdf.text(`Client : ${clientData.firstname || ""}`, clientX, startY);
    pdf.text(`Adresse : ${clientData.userAddress || ""}`, clientX, startY + 5);
    pdf.text(`Téléphone : ${clientData.phone || ""}`, clientX, startY + 10);
    pdf.text(`Email : ${clientData.email || ""}`, clientX, startY + 15);
  }


    // Calcul de la base totale pour les remises
  const totalBaseForDiscounts = parseFloat(catalogData.price) + reservation.fees.reduce((acc, fee) => {
    return acc + (fee.isPercentage ? (catalogData.price * fee.feeAmount) / 100 : fee.feeAmount);
  }, 0);

  // Préparer les éléments de la facture
  const items = [
    {
      description: `${catalogData.name} - ${catalogData.description}`,
      quantity: 1,
      priceHT: parseFloat(catalogData.price),
      priceTTC: parseFloat(catalogData.price),
    },
    ...reservation.fees.map((fee) => ({
      description: fee.feeName,
      quantity: 1,
      priceHT: fee.isPercentage
        ? parseFloat((catalogData.price * fee.feeAmount) / 100)
        : parseFloat(fee.feeAmount),
      priceTTC: fee.isPercentage
        ? parseFloat((catalogData.price * fee.feeAmount) / 100)
        : parseFloat(fee.feeAmount),
    })),
    ...reservation.discounts.map((discount) => ({
      description: discount.discountName,
      quantity: 1,
      priceHT: discount.isPercentage
        ? -parseFloat((totalBaseForDiscounts * discount.discountAmount) / 100)
        : -parseFloat(discount.discountAmount),
      priceTTC: discount.isPercentage
        ? -parseFloat((totalBaseForDiscounts * discount.discountAmount) / 100)
        : -parseFloat(discount.discountAmount),
    })),
  ];

  // Calcul du total
  const total = items.reduce((acc, item) => acc + item.priceTTC, 0);

  // Ajouter le tableau
  pdf.autoTable({
    startY: startY + 45,
    head: [["Désignation", "Qté", "Montant HT", "Montant TTC"]],
    body: items.map((item) => [
      item.description,
      item.quantity,
      `${item.priceHT.toFixed(2)} €`,
      `${item.priceTTC.toFixed(2)} €`,
    ]),
    styles: { font: "helvetica", fontStyle: "normal", fontSize: 10 },
      columnStyles: {
    0: { cellWidth: 115 }, 
    1: { cellWidth: 15 }, 
    2: { cellWidth: 30 }, 
    3: { cellWidth: 30 }, 
  },
  });

    // Totaux
    pdf.text(`Total : ${total.toFixed(2)} €`, 150, pdf.lastAutoTable.finalY + 10);

    // Pied de page
    pdf.text("Merci pour votre confiance.", 10, pdf.internal.pageSize.height - 60);

    // Tableau du Mode de Paiement (en bas à gauche)
  pdf.autoTable({
    startY: pdf.internal.pageSize.height - 40, // Positionner le tableau vers le bas
    margin: { left: 10 }, // Aligné à gauche
    body: [
      ["Mode de paiement", "Virement bancaire"],
      ["IBAN", userData.iban || ""],
      ["BIC", userData.bic || ""],
    ],
    theme: "plain",
    styles: { font: "helvetica", fontStyle: "normal", fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 40 }, // Colonne de gauche
      1: { cellWidth: 100 }, // Colonne de droite
    },

  });

   const pdfBlob = pdf.output("blob");
    // Téléverser le PDF dans Firebase Storage sans utiliser await ici
    uploadPDFToStorage(pdfBlob, fileName, docNumber);
    // Sauvegarder le PDF localement pour l’utilisateur
    pdf.save(fileName);
};

  return (
    <Tooltip title={`Générer ${type === "facture" ? "Facture" : "Devis"}`}>
      <IconButton onClick={generatePDF}>
        <PictureAsPdfIcon color="primary" />
      </IconButton>
    </Tooltip>
  );
};

export default PDFInvoiceGenerator;