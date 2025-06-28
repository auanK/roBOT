import { set, view } from "./handlers.js";

export default {
  name: "profile",
  description: "Gerencia perfis de usuários (apelido e descrição).",
  usage: "!profile set <nick|desc> <valor> ou !profile (@alguem)",

  run: async ({ args, ...props }) => {
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === "set") {
      args.shift();
      return set({ args, ...props });
    }

    return view(props);
  },
};
