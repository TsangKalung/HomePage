<template>
  <div class="navbar">
    <img class="navbar--logo" src="~/static/logo.svg" />
    <el-menu class="menu" mode="horizontal" :router="true">
      <el-menu-item index="/">首页</el-menu-item>
      <el-menu-item index="/resume">简历</el-menu-item>
      <el-menu-item index="/blog">博客</el-menu-item>
    </el-menu>
    <el-dropdown class="dropdown--menu">
      <span class="el-dropdown-link">
        更多
        <i class="el-icon-arrow-down el-icon--right"></i>
      </span>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item index="/">首页</el-dropdown-item>
        <el-dropdown-item index="/resume">简历</el-dropdown-item>
        <el-dropdown-item index="/blog">博客</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
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
    padding-left: 43%;
  }
  .menu {
    display: none;
  }
  .dropdown--menu {
    color: black;
    font-weight: bold;
    padding-left: 20%;
  }
  .el-dropdown-menu el-popper {
    color: #3a25ff;
  }
  .el-dropdown-menu__item:not(.is-disabled):hover {
    background-color: #3b25ff81;
    color: #3a25ff;
  }
}
</style>


