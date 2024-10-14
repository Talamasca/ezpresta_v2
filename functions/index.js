const functions = require("firebase-functions/v2");
const { onCall } = require("firebase-functions/v2/https");
const Mailjet = require("node-mailjet");
const admin = require("firebase-admin");

admin.initializeApp();

const MJ_APIKEY_PUBLIC = functions.config().mailjet.api_key_public;
const MJ_APIKEY_PRIVATE = functions.config().mailjet.api_key_private;

const mailjet = Mailjet.apiConnect(MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE);

const EZ_FROM_MAIL = "contact@ezpresta.fr";
const EZ_FROM_NAME = "EzPresta";


exports.sendConfirmationOrderV2 = onCall(async (request) => { 
  const data = request.data;
  
  data.email = "reginald.costa@gmail.com";
  data.username = "Reginald Costa";

  if (!data.email || !data.username) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Les informations email ou nom d'utilisateur sont manquantes"
    );
  }

  try {
    await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: EZ_FROM_MAIL,
            Name: EZ_FROM_NAME,
          },
          To: [
            {
              Email: "reginald.costa@gmail.com",
              Name: "Reginald Costa",
            },
          ],
          Subject: "Prestation validée !",
          TemplateID: 3172579,  // ID du modèle Mailjet
          TemplateLanguage: true,
          Variables: {
            title: "Prestation validée !",
            client: data.username,
            orderType: data.catalogType,
            orderClient: data.client,
            orderPlace: data.where,
            orderPlaceId: data.placeId,
            orderPrice: data.priceToPay,
            orderDate: data.date,
          },
        },
      ],
    });

    return { success: true, message: "Email envoyé avec succès" };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    throw new functions.https.HttpsError(
      "internal",
      "Erreur lors de l'envoi de l'e-mail."
    );
  }
});