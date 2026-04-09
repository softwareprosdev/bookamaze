import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export const queryDevtoolsPlugin = {
  render: <ReactQueryDevtools initialIsOpen={false} />,
}
