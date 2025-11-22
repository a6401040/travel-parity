## 目标
- 在不改变登录/注册功能逻辑的前提下，重写 `Login.vue` 与 `Register.vue` 的页面布局与样式，使其贴近 `prototype/出行—登录界面.html` 与 `prototype/出行-注册界面.html` 的风格。

## 设计与布局
- 登录页：两列布局（左：品牌与展示图、特点；右：登录卡片）。保留 `<LoginForm>` 组件及其事件，新增其他登录方式按钮与底部注册链接。
- 注册页：两列布局（左：渐变背景品牌与功能介绍；右：注册卡片）。保留 `<RegisterForm>` 组件及其事件，新增第三方注册按钮区与条款提示布局。
- 使用本项目现有 SCSS，自定义样式类实现渐变、阴影、栅格与响应式，不引入 Tailwind 等新依赖。

## 代码改动
- `src/views/user/Login.vue`
  - 模板：重构为左右结构容器，右侧卡片内放置 `<LoginForm @success="handleLoginSuccess" />` 与其他登录方式/注册链接。
  - 样式：新增 `.login-layout`、`.brand-section`、`.form-card` 等样式，支持移动端折行显示。
  - 保留成功回调用法与路由跳转逻辑。
- `src/views/user/Register.vue`
  - 模板：重构为左右结构容器，右侧卡片内放置 `<RegisterForm @success="handleRegisterSuccess" />` 与第三方按钮区。
  - 样式：新增 `.register-layout`、`.left-pane`、`.form-card` 等样式，同步响应式行为。
  - 保留注册成功后跳转至登录页逻辑。

## 验证
- 访问 `http://localhost:5173/auth/login` 与 `http://localhost:5173/auth/register`：
  - 表单输入与提交正常；登录成功跳转首页，注册成功跳转登录页。
  - 浏览器控制台无报错，`pnpm check` 类型检查通过。

## 风险与影响
- 仅变更视图模板与样式，保留原有组件逻辑与路由，无后端依赖变更；风险低。

请确认方案，确认后我将开始改造并完成验证。