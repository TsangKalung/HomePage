<template>
  <div>
    <!-- <div id="lottie" ref="lottie" style="height:500px"></div> -->
    <section class="header">
      <div class="header--image"></div>
      <div class="header--card">
        <h1>Tsang Kalung</h1>
        <h2>Truth becomes fiction when the fiction's true ; Real becomes not-real when the unreal's real.</h2>
      </div>
    </section>
  </div>
</template>
<script>
export default {
  mounted() {
    // const tag = document.createElement('script');
    // tag.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.5.7/lottie.min.js'
    // document.head.appendChild(tag)
    // window.onload = () => {
    //   var animation = bodymovin.loadAnimation({
    //     container: this.$refs.lottie, // Required
    //     path: "/lottie/office.json", // Required
    //     renderer: "svg/canvas/html", // Required
    //     loop: true, // Optional
    //     autoplay: true, // Optional
    //   });
    // };
  }
};
</script>
<style>
.header {
  margin-top: 30px;
  height: 700px;
  padding: 2.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
}
.header--image {
  background-image: url("../static/resume/header.jpg");
  background-position: center center;
  /* background-color: #3b25ff57;
  background-blend-mode: multiply; */
  background-size: cover;
  height: 500px;
  width: 50%;
  margin-left: 20%;
}
.header--card {
  background-color: white;
  width: 40%;
  height: 250px;
  margin: -380px auto 32px calc(8% + 32px);
  padding: 24px;
}
.header--card h1 {
  font-family: "Cereal Bold";
  font-weight: 700;
  font-size: 2.5em;
  letter-spacing: -0.8px;
}
.header--card h2 {
  font-family: "Cereal Light";
  font-weight: 100;
  font-size: 2.25em;
  letter-spacing: -0.8px;
  color: #767676;
  margin-bottom: 32px;
}
</style>
