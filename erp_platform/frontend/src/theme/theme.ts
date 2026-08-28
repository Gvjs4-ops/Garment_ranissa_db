import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#1976D2",
    },

    secondary: {
      main: "#424242",
    },

    success: {
      main: "#2E7D32",
    },

    warning: {
      main: "#ED6C02",
    },

    error: {
      main: "#D32F2F",
    },

    background: {
      default: "#F5F7FA",
      paper: "#FFFFFF",
    },
  },

  typography: {
    fontFamily: [
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),

    h4: {
      fontWeight: 700,
    },

    h5: {
      fontWeight: 600,
    },

    h6: {
      fontWeight: 600,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 10,
  },

  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#212121",
          boxShadow: "0px 1px 4px rgba(0,0,0,0.08)",
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E5E7EB",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
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

export default theme;
