import React, { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { collection, getDocs } from "firebase/firestore";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";

const colors = ["#8884d8", "#82ca9d", "#ffc658", "#d84f4c"];

// Fonction pour personnaliser l'affichage du libellé
const renderCustomLabel = ({ name, value }) => `${name} : ${value}`;

const ServiceTypeChartByYear = ({ selectedYear }) => {
  const { currentUser } = useAuth();
  const [serviceTypes, setServiceTypes] = useState([]);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      const typeCounts = {}; // Compteur pour chaque type de prestation

      // Récupération des données de `catalog` pour créer un mapping des types
      const catalogSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/catalog`));
      const catalogTypeMapping = {};

      catalogSnapshot.forEach(doc => {
        const catalogData = doc.data();
        catalogTypeMapping[doc.id] = catalogData.type; // Associe le `catalog_id` à son type
      });

      // Récupération des commandes validées et calcul du nombre de chaque type de prestation
      const ordersSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/orders`));
      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        const orderDate = new Date(order.selectedDate);

        // Ne tenir compte que des prestations validées pour l'année sélectionnée
        if (order.orderIsConfirmed && orderDate.getFullYear() === selectedYear) {
          const type = catalogTypeMapping[order.catalog_id] || "Type inconnu";
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
      });

      // Formater les données pour le graphique
      setServiceTypes(
        Object.entries(typeCounts).map(([name, value]) => ({ name, value }))
      );
    };

    fetchServiceTypes();
  }, [currentUser, selectedYear]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={serviceTypes}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={renderCustomLabel}
        >
          {colors.map((color, index) => (
            <Cell key={`cell-${index}`} fill={color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ServiceTypeChartByYear;
