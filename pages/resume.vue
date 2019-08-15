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
    <div class="after">
      <img src="/resume/after.svg" />
    </div>
    <section class="career">
      <h1>实习与项目</h1>
      <h2>微软中国（2017年11月-2018年1月）</h2>
      <ul>
        <li>参与新一代</li>
      </ul>
      <h2>旷视科技（2019年1月-至今）</h2>
      <ul>
        <li>参与新一代</li>
      </ul>
    </section>
  </div>
</template>

<script>
export default {};
</script>

<style lang="scss" scoped>
.header {
  margin-top: 30px;
  margin-bottom: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  padding: 2.5rem 0 0 0;
  @media only screen and (max-width: 1280px) {
    margin-bottom: 160px;
  }
  @media only screen and (max-width: 768px) {
    margin-bottom: 70px;
  }
}
.header--image {
  background-image: url("../static/resume/header.jpg");
  background-position: center center;
  background-size: cover;
  height: 500px;
  width: 45%;
  margin-left: 25%;
  z-index: 11;
  @media only screen and (max-width: 1280px) {
    width: 80%;
    margin: 0 10% 0 10%;
  }
  @media only screen and (max-width: 768px) {
    width: 100%;
    margin: 0;
    height: 45vh;
  }
}

.header--card {
  z-index: 12;
  background-color: white;
  padding: 24px;
  margin: -380px auto 32px calc(15% + 32px);
  width: 35%;

  h1 {
    font-family: "Cereal Bold";
    font-weight: 700;
    font-size: 2.75em;
    letter-spacing: -0.8px;
  }
  h2 {
    font-family: "Cereal Light";
    font-weight: 100;
    font-size: 2.25em;
    letter-spacing: -0.8px;
    color: #767676;
    margin-bottom: 32px;
    word-wrap: wrap break-word;
  }
  @media only screen and (max-width: 1280px) {
    margin: -180px auto 32px calc(18% + 32px);
    width: 80%;
    height: 200px;
    margin: 0;
  }
  @media only screen and (max-width: 768px) {
    width: 100%;
    height: 200px;
    margin: 0;
    h1 {
      font-size: 2.5em;
    }
    h2 {
      font-size: 1.75em;
      margin-bottom: 0;
    }
  }
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
.after {
  margin-top: -1px;
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
  @media only screen and(max-width: 450px) {
    background-size: 300px;
  }
}
.education--showbar {
  position: relative;
  top: -300px;
  left: 20%;
  @media only screen and (max-width: 450px) {
    left: 10%;
    h1 {
      font-size: 2.5rem;
    }
    h2 {
      font-size: 1.5rem;
    }
    img {
      height: 70px;
    }
  }
}
.education--showbar--text {
  padding-top: 40px;
  padding-left: 10px;
}
.career {
  height: 100vh;

  background-position: right center;
  background-repeat: no-repeat;
  background-size: 800px;
  color: #f61971;
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
</style>
