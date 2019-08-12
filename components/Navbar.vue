<template>
  <div class="navbar">
    <img class="navbar--logo" src="~/static/logo.svg" />
    <el-menu class="menu" mode="horizontal" :router="true">
      <el-menu-item index="/">首页</el-menu-item>
      <el-menu-item index="/resume">简历</el-menu-item>
      <!-- <el-menu-item index="/blog">博客</el-menu-item> -->
    </el-menu>
  </div>
</template>

<script>
</script>

<style>
.navbar {
  height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.navbar--logo {
  height: 60px;
  padding-left: 20%;
}
.menu {
  height: 80px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-left: 5%;
  padding-right: 15%;
}
.el-menu.el-menu--horizontal {
  border-bottom: solid 3px black;
}
.el-menu--horizontal > .el-menu-item {
  color: black;
  font-size: 1rem;
  font-weight: bold;
}
.el-menu--horizontal>.el-menu-item.is-active {
  color:#3a25ff;
  border-bottom: solid 3px #3a25ff;
}
.el-menu--horizontal .el-menu-item:not(.is-disabled):focus, .el-menu--horizontal .el-menu-item:not(.is-disabled):hover {
  color:#3a25ff;
}
</style>


