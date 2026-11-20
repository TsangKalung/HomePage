<template>
  <footer>
    <div style="width:auto">
      <div class="footer--name">
        <h1>Tsang Kalung</h1>
        <img class="footer--image" src="~/static/logo.svg" />
      </div>
      <p>电话：188 ❧ 10940355</p>
      <p>邮箱：tsangkalung ❧ bupt.edu.cn</p>
      <p>© 2019 Powered by Tsang Kalung | 京ICP备19021671号</p>
    </div>
  </footer>
</template>




<style scoped>
.footer {
  height: 250px;
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
}

.footer--name {
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: flex-end;
}
.footer--name h1 {
  font-size: 2.75rem;
  font-family: "Cereal";
  font-weight: 500;
  padding-right: 20px;
  color: black;
}
.footer p {
  font-weight: 500;
  font-family: "Cereal";
}
.footer--image {
  height: 75px;
  padding-bottom: 10px;
  padding-right: 5px;
}
</style>


