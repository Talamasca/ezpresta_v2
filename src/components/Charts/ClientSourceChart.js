import React, { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { collection, getDocs } from "firebase/firestore";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";

// Palette de base des couleurs
const baseColors = ["#2eb7ba", "#d14845", "#AE948F", "#8E5E85", "#FFA726", "#66BB6A", "#42A5F5"];

const generateColors = numColors => {
  const colors = [];
  for (let i = 0; i < numColors; i++) {
    colors.push(baseColors[i % baseColors.length]); // Répète la palette de base si besoin
  }
  return colors;
};

// Fonction pour personnaliser l'affichage du libellé
const renderCustomLabel = ({ name, value }) => `${name} : ${value}`;

const ClientSourceChart = () => {
  const { currentUser } = useAuth();
  const [clientSources, setClientSources] = useState([]);
  const [colors, setColors] = useState([]);

  useEffect(() => {
    const fetchClientSources = async () => {
      const sourceSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/customerSource`));
      const sources = {};

      sourceSnapshot.forEach(doc => {
        const sourceData = doc.data();
        sources[sourceData.name] = 0; // Initialise chaque source à 0
      });

      const customersSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/customers`));

      customersSnapshot.forEach(doc => {
        const customer = doc.data();
        if (customer.source && sources[customer.source] !== undefined) {
          sources[customer.source] += 1;
        } else {
          sources["Autre"] = (sources["Autre"] || 0) + 1;
        }
      });

      // Formater les données pour le graphique
      const formattedSources = Object.entries(sources).map(([name, value]) => ({ name, value }));
      setClientSources(formattedSources);

      // Générer un tableau de couleurs dynamique
      setColors(generateColors(formattedSources.length));
    };

    fetchClientSources();
  }, [currentUser]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={clientSources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={renderCustomLabel}>
          {clientSources.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ClientSourceChart;
