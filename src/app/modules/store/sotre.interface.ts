export type IStore = {
  title: string;
  image: string;
  link: string;
  storeId: string;
  storeStatus: 'Delivered' | 'TakeDown' | 'Pending';
};
