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
      {
        type: "REPLY",
        id: "/menu",
        title: "Back to menu",
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
      {
        type: "REPLY",
        id: "/menu",
        title: "Back to menu",
      },
    ];
  }

  return [
    {
      type: "REPLY",
      id: `${commandPrefix}:prev`,
      title: "Previous",
    },
    {
      type: "REPLY",
      id: "/menu",
      title: "Back to menu",
    },
  ];
}

module.exports = {
  getPaginationButtons,
};
