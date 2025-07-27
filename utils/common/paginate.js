function paginate(list, page, perPage) {
  const offset = (page - 1) * perPage;
  return {
    items: list.slice(offset, offset + perPage),
    offset,
    page,
    hasNextPage: list.length > offset + perPage,
    hasPrevPage: page > 1,
  };
}

module.exports = {
  paginate,
};
