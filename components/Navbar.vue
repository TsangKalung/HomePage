<template>
  <div class="navbar">
    <img class="navbar--logo" src="~/static/logo.svg" />
    <el-menu class="menu" mode="horizontal" :router="true">
      <el-menu-item index="/">首页</el-menu-item>
      <el-menu-item index="/resume">简历</el-menu-item>
      <el-menu-item index="/blog">博客</el-menu-item>
    </el-menu>
    <el-menu class="dropdown--menu" mode="horizontal" :router="true" menu-trigger="click">
      <el-submenu>
        <template slot="title">更多</template>
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/resume">简历</el-menu-item>
        <el-menu-item index="/blog">博客</el-menu-item>
      </el-submenu>
    </el-menu>
  </div>
</template>

<script>
</script>

<style lang="scss" scoped>
@media only screen and (min-width: 768px) {
  .navbar {
    height: 80px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .navbar--logo {
    height: 60px;
  }
  .menu,
  .dropdown--menu {
    height: 80px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .el-menu.el-menu--horizontal {
    border-bottom: solid 3px black;
  }
  .el-menu--horizontal > .el-menu-item {
    color: black;
    font-size: 1rem;
    font-weight: bold;
  }
  .el-menu--horizontal > .el-menu-item.is-active {
    color: #3a25ff;
    border-bottom: solid 3px #3a25ff;
  }
  .el-menu--horizontal .el-menu-item:not(.is-disabled):focus,
  .el-menu--horizontal .el-menu-item:not(.is-disabled):hover {
    color: #3a25ff;
  }
  .dropdown--menu {
    display: none;
  }
}
@media only screen and (max-width: 768px) {
  .navbar {
    height: 80px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
  }
  .navbar--logo {
    height: 60px;
    padding-left: calc(50%-30px);
  }
  .menu {
    display: none;
  }
  .dropdown--menu {
    color: black;
    font-weight: bold;
    border-right: none;
    width: 90px;
  }
  .el-submenu__title {
    border: none;
    color: black;
  }
}
</style>


