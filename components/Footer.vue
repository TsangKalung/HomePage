<template>
  <footer>
    <div style="width:375px;">
      <div class="footer--name">
        <h1>Tsang Kalung</h1>
        <img class="footer--image" src="~/static/logo.svg" />
      </div>
      <p>京ICP备19021671号</p>
      <p>©Designed by Tsang Kalung</p>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.footer {
  height: 300px;
  background: #e6e6e6;
  text-align: right;
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-between;
  align-items: center;
  color: black;
  padding-left: 5%;
  padding-right: 5%;
  padding-bottom: 30px;
  p {
    font-weight: 500;
    font-family: "Cereal";
    @media only screen and (max-width: 768px) {
      font-weight: 400;
      font-family: "Roboto";
    }
  }
}

.footer--name {
  display: flex;
  flex-direction: row;
  align-content: center;
  justify-content: flex-end;
  width: 400px;
  margin-bottom: 20px;
  padding-right: 15px;
  h1 {
    font-size: 2.75rem;
    font-family: "Cereal";
    font-weight: 500;
    padding-right: 20px;
    color: black;
  }
  @media only screen and (max-width: 768px) {
    h1 {
      font-size: 2.5rem;
      padding-right: 5px;
      flex-direction: column-reverse;
      justify-content: flex-start;
    }
  }
}
.footer--image {
  height: 75px;
  padding-bottom: 10px;
  padding-right: 5px;
  @media only screen and (max-width: 768px) {
    height: 60px;
    padding-right: 0px;
  }
}
</style>


