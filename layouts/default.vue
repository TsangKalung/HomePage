<template>
  <div>
    <link
      href="https://fonts.googleapis.com/css?family=Fascinate|Noto+Sans&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons"
      rel="stylesheet"
    />

    <Navbar class="navbar" />
    <nuxt class="content" />
    <Footer class="footer" />
  </div>
</template>

<script>
import Navbar from "~/components/Navbar.vue";
import Footer from "~/components/Footer.vue";

export default {
  mounted() {
    if (
      //iPad can see original.
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i)
    ) {
      this.$router.push("/mobile");
    }
  },
  components: {
    Navbar,
    Footer
  }
};
</script>

<style>
html {
  font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}
@font-face {
  font-family: Cereal;
  src: url("../static/fonts/AirbnbCerealBold.woff");
}
@font-face {
  font-family: Cereal Bold;
  src: url("../static/fonts/AirbnbCerealExtraBold.woff");
}
@font-face {
  font-family: Cereal Light;
  src: url("../static/fonts/AirbnbCerealLight.woff");
}
::selection {
  background-color: #f61971;
}
.content {
  margin-top: 0px;
}
a:-webkit-any-link {
  color:#f61971;
  font-size: bolder;
}
</style>
