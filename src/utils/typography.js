import Typography from "typography"
import Wordpress2016 from "typography-theme-wordpress-2016"
import "./shared.css"

Wordpress2016.overrideThemeStyles = () => {
  return {
    "a.gatsby-resp-image-link": {
      boxShadow: `none`,
    },
    a: {
      color: "var(--textLink)",
      boxShadow: "0px 0px",
    },
    "p code": {
      fontSize: "1rem",
    },
    blockquote: {
      color: "var(--textNormal)",
      borderLeft: "0.32813rem solid var(--textNormal)",
    },
    "h1 code, h2 code, h3 code, h4 code, h5 code, h6 code": {
      fontSize: "inherit",
    },
    "li code": {
      fontSize: "1rem",
    },
  }
}

delete Wordpress2016.googleFonts

const typography = new Typography(Wordpress2016)

// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
  typography.injectStyles()
}

export default typography
export const rhythm = typography.rhythm
export const scale = typography.scale
