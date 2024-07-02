// src/utils.js

// pour définir la durée d'une prestation
export function getDuration() {
  return [{ id: -1, name: "Toute la journée" }].concat(
    Array.from(Array(47).keys()).map((I) => ({
      id: I + 1,
      name: `${Math.ceil(I / 2)}h${I % 2 ? "30" : "00"}`, // Fixed typo here
    }))
  );
}

export function getFormattedDuration(duration) {
  const durationOptions = getDuration();
  const durationItem = durationOptions.find((d) => d.id === duration);
  return durationItem ? durationItem.name : duration;
}

export function price(number) {
  return new Intl.NumberFormat("fr-FR", {
    currency: "EUR",
    style: "currency",
  }).format(number);
}
