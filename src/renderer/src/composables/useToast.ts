import { reactive, toRefs } from 'vue'

const state = reactive({
  message: '',
  visible: false,
  _timer: null as ReturnType<typeof setTimeout> | null
})

export function useToast() {
  function show(msg: string, duration = 3000) {
    if (state._timer) clearTimeout(state._timer)
    state.message = msg
    state.visible = true
    state._timer = setTimeout(() => {
      state.visible = false
      state._timer = null
    }, duration)
  }

  return { ...toRefs(state), show }
}
