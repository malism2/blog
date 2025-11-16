---
outline: deep
---

## Android

<!-- 使用 Vue 语法遍历 $pages -->
<ul>
  <li v-for="page in $pages" :key="page.path">
    <a :href="page.path">{{ page.title }}</a>
  </li>
</ul>