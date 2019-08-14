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
    <section class="education">
      <div class="education--showbar">
        <h1>教育经历</h1>
        <img src="/resume/bupt.png" />
        <div class="education--showbar--text">
          <h2>电子信息工程在读</h2>
          <h2>2017-2021年</h2>
          <h2>
            参与
            <a href="bbs.byr.cn">北邮人论坛</a>的维护
          </h2>
        </div>
        <div class="education--showbar--text">
          <h2>在校项目：</h2>
          <h2>
            <a href="/resume/">书楼吊堂</a>
          </h2>
          <h2>
            <a href="/resume/">你的书单</a>
          </h2>
        </div>
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
<style lang="scss" scoped>
.header {
  margin-top: 30px;
  height: 620px;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;

  padding: 2.5rem 0 0 0;
}
.header--image {
  background-image: url("../static/resume/header.jpg");
  background-position: center center;
  background-size: cover;
  height: 500px;
  width: 50%;
  margin-left: 20%;
  z-index: 11;
}

.header--card {
  z-index: 12;
  background-color: white;
  padding: 24px;
  margin: -380px auto 32px calc(8% + 32px);
  width: 40%;
  height: 250px;
  h1 {
    font-family: "Cereal Bold";
    font-weight: 700;
    font-size: 2.5em;
    letter-spacing: -0.8px;
  }
  h2 {
    font-family: "Cereal Light";
    font-weight: 100;
    font-size: 2.25em;
    letter-spacing: -0.8px;
    color: #767676;

    margin-bottom: 32px;
  }

  // @media only screen and (min-width: 768px) {
  //   margin: -300px 5% 32px auto;
  //   height: auto;
  //   h1 {
  //     font-size: 2.5em;
  //     letter-spacing: -0.8px;
  //   }
  //   h2 {
  //     font-size: 2.25em;
  //     letter-spacing: -0.8px;
  //     margin-bottom: 32px;
  //   }
  // }
  // h1 {
  //   font-family: "Cereal Bold";
  //   font-weight: 700;
  //   font-size: 2em;
  // }
  // h2 {
  //   font-family: "Cereal Light";
  //   font-weight: 100;
  //   font-size: 1.75em;
  //   color: #767676;
  //   margin-bottom: 10px;
  // }
}
.education:before {
  content: "";
  display: block;
  position: relative;
  background-image: url("/resume/before.svg");
  background-position: center bottom;
  background-repeat: no-repeat;
  visibility: visible;
  z-index: 10;
  height: 375px;
  width: 100%;
  top: -374px;
}
.education {
  background-color: #3a25ff;
  background-image: url("/resume/education.svg");
  background-position: right center;
  background-repeat: no-repeat;
  background-size: 800px;
  color: white;
  h1 {
    font-weight: bolder;
    font-size: 4rem;
    margin-bottom: 50px;
  }
  h2 {
    font-size: 1.5rem;
    padding-top: 0.5rem;
  }
}
.education--showbar {
  position: relative;
  top: -300px;
  left: 20%;
}
.education--showbar--text {
  padding-top: 40px;
  padding-left: 10px;
}
</style>
