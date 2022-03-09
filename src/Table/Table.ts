import { defineComponent, h, toRefs, VNode, provide } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ElTable, ElTableColumn, ElPagination, useAttrs } from 'element-plus'
import {
  useTableColumns,
  useTableBind,
  useTableDefaultBind,
  useTableMethods,
  usePagination,
} from '../composables/index'
import props, { paginationKeys } from './props'
import emits from './emits'
import ProTableItem from './TableItem'
import type { StringObject } from '../types/index'
import type {
  ITableSelectionColumns,
  ITableExpandColumns,
  ITableIndexColumns,
  ITableMenuColumns,
} from './type'

export default defineComponent({
  name: 'ProTable',
  props,
  emits,
  setup(props, { slots, emit, expose }) {
    const { selection, expand, index, menu } = toRefs(props)
    const attrs = useAttrs()
    const columns = useTableColumns(props)
    const defaultBind = useTableDefaultBind(props)
    const bindSelection = useTableBind<ITableSelectionColumns>(
      selection,
      defaultBind
    )
    const bindExpand = useTableBind<ITableExpandColumns>(expand, defaultBind)
    const bindIndex = useTableBind<ITableIndexColumns>(index, defaultBind)
    const bindMenu = useTableBind<ITableMenuColumns>(menu, defaultBind)
    const { pagination, sizeChange, currentChange } = usePagination(props, emit)
    const {
      table,
      clearSelection,
      toggleRowSelection,
      toggleAllSelection,
      toggleRowExpansion,
      setCurrentRow,
      clearSort,
      clearFilter,
      doLayout,
      sort,
    } = useTableMethods()
    const config = reactiveOmit(
      props,
      ...paginationKeys,
      'showOverflowTooltip',
      'align',
      'headerAlign'
    )

    provide('defaultBind', defaultBind)

    expose({
      clearSelection,
      toggleRowSelection,
      toggleAllSelection,
      toggleRowExpansion,
      setCurrentRow,
      clearSort,
      clearFilter,
      doLayout,
      sort,
    })

    function createColumn() {
      let list: VNode[] = []

      if (selection.value) {
        list.push(
          h(ElTableColumn, { type: 'selection', ...bindSelection.value })
        )
      }
      if (expand.value !== false && slots.expand) {
        list.push(
          h(
            ElTableColumn,
            { type: 'expand', ...bindExpand.value },
            {
              default: (scope: unknown) => slots.expand && slots.expand(scope),
            }
          )
        )
      }
      if (index.value) {
        list.push(h(ElTableColumn, { type: 'index', ...bindIndex.value }))
      }
      if (columns.value) {
        const tableItem = columns.value.map((item) => {
          return h(ProTableItem, { item, size: props.size }, slots)
        })

        list = list.concat(tableItem)
      }
      if (slots.default) {
        list = list.concat(slots.default())
      }
      if (menu.value !== false && slots.menu) {
        list.push(
          h(
            ElTableColumn,
            { type: 'menu', ...bindMenu.value },
            {
              default: (scope: StringObject) =>
                slots.menu && slots.menu({ ...scope, size: props.size }),
            }
          )
        )
      }

      return list
    }

    function createDefault() {
      const tableNode = h(
        ElTable,
        {
          ...config,
          ...attrs.value,
          ref: table,
        },
        {
          default: () => createColumn(),
          append: slots.append,
        }
      )
      const paginationNode = h(ElPagination, {
        ...pagination.value,
        'onUpdate:pageSize': sizeChange,
        'onUpdate:currentPage': currentChange,
      })

      return [tableNode, props.total ? paginationNode : null]
    }

    return () => h('div', { class: 'pro-table' }, createDefault())
  },
})
