export const fakeAddonGroup = (data = {}) => ({
  title: "Addon Group 1",
  ...data,
});
export const fakeAddon = (data = {}) => ({
  title: "Addon 1",
  status: "published",
  thumbnail: "addon-image.png",
  variants: [
    {
      title: "Addon Variant 1",
      prices: [
        {
          amount: 5,
          currency_code: "nzd",
        },
      ],
    },
  ],
  ...data,
});
export const fakeProduct = (data = {}) => ({
  title: "Product 1",
  status: "published",
  options: [
    {
      title: "Size",
      values: ["small", "medium", "large"],
    },
  ],
  variants: [
    {
      title: "Variant 1",
      options: {
        Size: "small",
      },
      manage_inventory: false,
      prices: [
        {
          amount: 10,
          currency_code: "nzd",
        },
      ],
    },
  ],
  ...data,
});
