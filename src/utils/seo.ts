// Portuguese months mapping
const MESES_PORTUGUES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const formatDateToPortuguese = (dateString: string): string => {
  try {
    // Parse the Brazilian date format (DD/MM/YYYY)
    const [day, month, year] = dateString.split("/").map(Number);

    if (day && month && year && month >= 1 && month <= 12) {
      const monthName = MESES_PORTUGUES[month - 1]; // month is 1-based, array is 0-based
      return `${day.toString().padStart(2, "0")} de ${monthName}`;
    }

    // Fallback: try parsing as ISO date
    const date = new Date(dateString);
    const dayNum = date.getDate().toString().padStart(2, "0");
    const monthName = MESES_PORTUGUES[date.getMonth()];

    return `${dayNum} de ${monthName}`;
  } catch {
    // Fallback if date parsing fails
    return new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
    });
  }
};

export const seo = ({
  title,
  description,
  keywords,
  image,
  url,
}: {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
  url?: string;
}) => {
  const tags = [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    // { name: 'twitter:creator', content: '@tannerlinsley' },
    // { name: 'twitter:site', content: '@tannerlinsley' },
    ...(!!url ? [{ name: "og:url", content: url }] : []),
    { name: "og:type", content: "website" },
    { name: "og:title", content: title },
    { name: "og:description", content: description },
    ...(image
      ? [
          { name: "twitter:image", content: image },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "og:image", content: image },
        ]
      : []),
  ];

  return tags;
};
