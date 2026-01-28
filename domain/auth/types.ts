export type UserRole = "owner" | "manager" | "staff" | string;

export type UserMe = {
  user_id: number | string;
  roles: UserRole[];
  accessible_store_ids: Array<number | string>;
};


