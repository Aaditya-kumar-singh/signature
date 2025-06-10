export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const truncate = (str, n) => {
  return str.length > n ? str.substring(0, n - 1) + '...' : str;
};