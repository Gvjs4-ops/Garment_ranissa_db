
import { createTheme } from "@mui/material/styles";
import type { ThemeConfig } from "../config/customers/types";

const presets: Record<
  string,
  {
    primary: string;
    secondary: string;
    background: string;
    paper: string;
  }
> = {
  corporateBlue: {
    primary: "#1565C0",
    secondary: "#455A64",
    background: "#F4F7FB",
    paper: "#FFFFFF",
  },
  forestGreen: {
    primary: "#2E7D32",
    secondary: "#00695C",
    background: "#F1F8F2",
    paper: "#FFFFFF",
  },
  royalPurple: {
    primary: "#7B1FA2",
    secondary: "#512DA8",
    background: "#F7F2FA",
    paper: "#FFFFFF",
  },
  warmOrange: {
    primary: "#E65100",
    secondary: "#795548",
    background: "#FFF7F0",
    paper: "#FFFFFF",
  },
};
export function createAppTheme(config: ThemeConfig) {
  const preset = presets[config.preset] ?? presets.corporateBlue;

  const primary = config.primaryColor ?? preset.primary;
  const secondary = config.secondaryColor ?? preset.secondary;
  const dark = config.mode === "dark";

  return createTheme({

palette: {
  mode: config.mode,
  primary: {
    main: primary,
  },
  secondary: {
    main: secondary,
  },
  success: { main: "#2E7D32" },
  warning: { main: "#ED6C02" },
  error: { main: "#D32F2F" },
  background:
    config.mode === "dark"
      ? {
          default: "#121212",
          paper: "#1E1E1E",
        }
      : {
          default: preset.background,
          paper: preset.paper,
        },
},
typography: {
  fontFamily:
    config.fontFamily ??
    '"Roboto", "Helvetica", "Arial", sans-serif',

  h4: { fontWeight: 700 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },

  button: {
    textTransform: "none",
    fontWeight: 600,
  },
},
    shape: {
      borderRadius: config.borderRadius,
    },

    components: {
   
MuiAppBar: {
  styleOverrides: {
    root: {
      boxShadow: "0px 1px 4px rgba(0,0,0,0.08)",
    },
  },
},
MuiDrawer: {
  styleOverrides: {
    paper: {
      backgroundImage: "none",
    },
  },
}, 
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: config.borderRadius + 2,
            boxShadow: dark
              ? "0 2px 10px rgba(0,0,0,0.25)"
              : "0 2px 10px rgba(0,0,0,0.06)",
          },
        },
      },

      MuiButton: {
        defaultProps: {
          variant: "contained",
        },
      },
    },
  });
}
