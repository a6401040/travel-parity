import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

// 页面组件
const Home = () => import('@/views/Home.vue')
const Login = () => import('@/views/user/Login.vue')
const Register = () => import('@/views/user/Register.vue')
const Subscribe = () => import('@/views/Subscribe.vue')
const Schemes = () => import('@/views/Schemes.vue')
const Chat = () => import('@/views/Chat.vue')
const History = () => import('@/views/History.vue')
const Settings = () => import('@/views/settings/Settings.vue')
const Profile = () => import('@/views/settings/Profile.vue')
const ProfileEdit = () => import('@/views/settings/ProfileEdit.vue')
const DownloadSettings = () => import('@/views/settings/DownloadSettings.vue')
const About = () => import('@/views/settings/About.vue')
const Password = () => import('@/views/settings/Password.vue')
const Logout = () => import('@/views/settings/Logout.vue')
const DeleteAccount = () => import('@/views/settings/DeleteAccount.vue')

// 布局组件
const DefaultLayout = () => import('@/layouts/DefaultLayout.vue')
const ChatLayout = () => import('@/layouts/ChatLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/chat',
    name: 'Chat',
    component: Chat,
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'History',
    component: History
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'Login',
        component: Login,
        meta: { requiresGuest: true }
      },
      {
        path: 'register',
        name: 'Register',
        component: Register,
        meta: { requiresGuest: true }
      }
    ]
  },
  {
    path: '/subscribe',
    name: 'Subscribe',
    component: Subscribe,
    meta: { requiresAuth: true }
  },
  {
    path: '/schemes',
    name: 'Schemes',
    component: Schemes
  },
  {
    path: '/settings',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Settings',
        component: Settings
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile
      },
      {
        path: 'profile/edit',
        name: 'ProfileEdit',
        component: ProfileEdit
      },
      {
        path: 'download',
        name: 'DownloadSettings',
        component: DownloadSettings
      },
      {
        path: 'about',
        name: 'About',
        component: About
      },
      {
        path: 'password',
        name: 'Password',
        component: Password
      },
      {
        path: 'logout',
        name: 'Logout',
        component: Logout
      },
      {
        path: 'delete',
        name: 'DeleteAccount',
        component: DeleteAccount
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 需要认证的路由
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    next('/auth/login')
    return
  }
  
  // 需要游客身份的路由（已登录用户不能访问）
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/')
    return
  }
  
  next()
})

export default router