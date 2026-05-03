import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSetAtom } from 'jotai'
import Cell from '@/components/cell'
import { updateContentAtom } from '@/atom'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

type Props = {
  property: string
  value: string | null
  negate: boolean
}
const UnicodeProperty: React.FC<Props> = ({ property, value, negate }) => {
  const { t } = useTranslation()
  const updateContent = useSetAtom(updateContentAtom)

  const onNegateChange = (negate: boolean) => {
    updateContent({
      kind: 'unicodeProperty',
      property,
      value,
      negate,
    })
  }

  const onPropertyChange = (newProperty: string) => {
    updateContent({
      kind: 'unicodeProperty',
      property: newProperty,
      value,
      negate,
    })
  }

  const onValueChange = (newValue: string) => {
    updateContent({
      kind: 'unicodeProperty',
      property,
      value: newValue === '' ? null : newValue,
      negate,
    })
  }

  return (
    <>
      <Cell.Item label={t('Property')}>
        <Input
          className="w-52 font-mono"
          value={property}
          onChange={onPropertyChange}
          placeholder={t('e.g., Lu, Ll, Script')}
        />
      </Cell.Item>
      <Cell.Item label={t('Value')}>
        <Input
          className="w-52 font-mono"
          value={value || ''}
          onChange={onValueChange}
          placeholder={t('e.g., Latin (optional)')}
        />
      </Cell.Item>
      <Cell.Item label={t('Negate')}>
        <label
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Checkbox checked={negate} onCheckedChange={onNegateChange} />
            <span>{t('negate')}</span>
          </div>
        </label>
      </Cell.Item>
    </>
  )
}

export default UnicodeProperty
