function getPaginationButtons(paginate, commandPrefix) {
  if (paginate.hasNextPage && paginate.hasPrevPage) {
    return [
      {
        type: "REPLY",
        id: `${commandPrefix}:prev`,
        title: "Previous",
      },
      {
        type: "REPLY",
        id: `${commandPrefix}:next`,
        title: "Next",
      },
    ];
  }

  if (paginate.hasNextPage) {
    return [
      {
        type: "REPLY",
        id: `${commandPrefix}:next`,
        title: "Next",
      },
    ];
  }

  return [
    {
      type: "REPLY",
      id: `${commandPrefix}:prev`,
      title: "Previous",
    },
  ];
}

module.exports = {
  getPaginationButtons,
};
