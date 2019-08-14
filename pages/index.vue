<template>
  <div class="container">
    <section class="banner">
      <img src="~/static/index/fly.gif" />
      <h1>Tsang Kalung</h1>
      <img class="banner--name" src="~/static/index/name.svg" />
    </section>
    <section class="introduction">
      <h1>INTRODUCTION</h1>
      <p class="introduction--text">
        我是曾家龙（zēng jiā lóng 或 cang4 gaa1 lung4<sup> * 粤语英文转写为Tsang Ka Lung</sup>），就读于北京邮电大学电子信息工程专业（2017年-2021年）。我是一名字体排印、铁路文化和交互设计的爱好者。我曾在微软(Microsoft)和旷视(Megvii)实习过，想了解我的职业技能和实习经历请阅读我的
        <a
          href="/resume"
        >简历</a>。
      </p>
      <h1>CONTACTS</h1>
      <div class="contact--text">
        <img src="~/static/index/telephone.svg" />
        <p>Mobile Phone: 188 ❧ 10940355  </p>
      </div>
      <div class="contact--text">
        <img src="~/static/index/mail.svg" />
        <p>Mail: tsangkalung ❧ bupt.edu.cn</p>
      </div>
      <div class="contact--text">
        <img src="~/static/index/telegram.svg" />
        <p>Telegram ID: Tsang Kalung   </p>
      </div>
      <div class="contact--wechat">
        <p>Wechat:</p>
        <img src="~/static/index/wechat.jpeg" />
      </div>
      <h1>SITES</h1>
      <div class="contact--text">
        <img src="~/static/index/github.svg" />
        <p>GitHub: <a href="https://github.com/TsangKalung">TsangKalung</a>  </p>
      </div>
      <div class="contact--text">
        <img src="~/static/index/douban.svg" />
        <p>Douban: <a href="https://www.douban.com/people/Kalung_Tsang/">Tsang Kalung</a></p>
      </div>
      <h1>❦</h1>
    </section>
  </div>
</template>

<script>
export default {};
</script>

<style lang="scss">
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.banner {
  padding-bottom: 5vh;
  @media only screen and (max-width: 768px) {
    img {
      width: 100vw;
    }
  }

}
.banner--name {
  height: 3.5rem;
}
.introduction {
  background-color: black;
  color: white;
  width: 100%;
  padding: 4vh 0 5vh 0;
}
.introduction--text {
  padding: 10px 25% 10px 25%;
  text-align: left;
  font-size: 20px;
  font-weight: 500;
}
.contact--text {
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: center;
  padding-bottom: 10px;
  font-family: "Cereal";
  font-size: 20px;
  font-weight: 500;
}

.contact--text img {
  height: 25px;
  padding-right: 10px;
}
.contact--wechat {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  padding-bottom: 10px;
  font-family: "Cereal";
  font-size: 20px;
  font-weight: 500;
}
.contact--wechat img {
  height: 150px;
}
.contact--wechat p {
  padding-bottom: 18px;
}
.container h1 {
  font-family: "Fascinate", cursive;
  font-size: 3rem;
  padding-top: 20px;
  padding-bottom: 10px;
}
h2 {
  font-size: 2rem;
}
sup {
  font-size: 14px;
}

</style>
