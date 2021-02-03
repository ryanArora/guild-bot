import axios, { AxiosError, AxiosResponse } from "axios";

export interface MinecraftProfile {
  id: string;
  name: string;
}

export async function getMinecraftProfile(name: string) {
  return new Promise<MinecraftProfile | null>((resolve, reject) => {
    axios
      .get(`https://api.mojang.com/users/profiles/minecraft/${name}`)
      .then((res: AxiosResponse) => {
        const profile: MinecraftProfile | null = res.data ? res.data : null;
        resolve(profile);
      })
      .catch((err: AxiosError) => {
        reject(err);
      });
  });
}

export interface NameHistoryElement {
  name: MinecraftProfile["name"];
  changedToAt?: number;
}

export async function getMinecraftNameHistory(uuid: string) {
  return new Promise<NameHistoryElement[]>((resolve, reject) => {
    axios
      .get(`https://api.mojang.com/user/profiles/${uuid}/names`)
      .then((res: AxiosResponse) => {
        const history: NameHistoryElement[] = res.data;
        resolve(history);
      })
      .catch((err: AxiosError) => {
        reject(err);
      });
  });
}
