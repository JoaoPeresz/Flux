'use client'

import { useEffect, useState } from 'react'
import { categoryApi } from '@/services/api'
import { Category } from '@/types'
import Modal from '@/components/ui/Modal'
import formStyles from '@/components/ui/form.module.css'
import styles from './page.module.css'

// MUI Icons
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded'
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded'
import PetsRoundedIcon from '@mui/icons-material/PetsRounded'
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded'
import CheckroomRoundedIcon from '@mui/icons-material/CheckroomRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import WorkRoundedIcon from '@mui/icons-material/WorkRounded'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'

const ICONS: Record<string, React.ReactNode> = {
  home: <HomeRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  car: <DirectionsCarRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  utensils: <RestaurantRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  'heart-pulse': <LocalHospitalRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  shopping: <ShoppingCartRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  'shopping-cart': <ShoppingCartRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  'paw-print': <PetsRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  'gamepad-2': <SportsEsportsRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  shirt: <CheckroomRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  'book-open': <MenuBookRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  zap: <FlashOnRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  'trending-up': <TrendingUpRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  wallet: <AccountBalanceWalletRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  briefcase: <WorkRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  'circle-ellipsis': <MoreHorizRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  money: <AttachMoneyRoundedIcon style={{ color: '#fff', fontSize: 24 }} />,
  default: <CategoryRoundedIcon style={{ color: '#fff', fontSize: 24 }} />
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    icon: 'default',
    color: '#6C63FF',
    isIncome: false,
    ruleGroup: 'NEEDS' as import('@/types').RuleGroup
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await categoryApi.list()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNew = () => {
    setEditingId(null)
    setFormData({ name: '', icon: 'default', color: '#6C63FF', isIncome: false, ruleGroup: 'NEEDS' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (c: Category) => {
    setEditingId(c.id)
    setFormData({
      name: c.name,
      icon: c.icon,
      color: c.color,
      isIncome: c.isIncome,
      ruleGroup: c.ruleGroup || 'NEEDS'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria? Lançamentos atrelados poderão ficar órfãos.')) return
    try {
      await categoryApi.delete(id)
      loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Não foi possível excluir. Talvez existam lançamentos usando esta categoria.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await categoryApi.update(editingId, formData)
      } else {
        await categoryApi.create(formData)
      }
      setIsModalOpen(false)
      loadCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Erro ao salvar categoria.')
    }
  }

  const incomes = categories.filter(c => c.isIncome)
  const needs = categories.filter(c => !c.isIncome && c.ruleGroup === 'NEEDS')
  const wants = categories.filter(c => !c.isIncome && c.ruleGroup === 'WANTS')
  const savings = categories.filter(c => !c.isIncome && c.ruleGroup === 'SAVINGS')

  const renderGroup = (title: string, list: Category[], badgeClass: string, badgeLabel: string) => (
    <div style={{ marginBottom: 32 }}>
      <h2 className={styles.groupTitle}>{title}</h2>
      <div className={styles.grid}>
        {list.length === 0 ? (
          <div className={styles.emptyGroup}>Nenhuma categoria adicionada.</div>
        ) : (
          list.map(c => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrap} style={{ backgroundColor: c.color }}>
                  {ICONS[c.icon] || ICONS.default}
                </div>
                <div className={styles.actions}>
                  <button className={styles.iconBtn} onClick={() => handleOpenEdit(c)}>
                    <EditRoundedIcon style={{ fontSize: 18 }} />
                  </button>
                  <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(c.id)}>
                    <DeleteOutlineRoundedIcon style={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardTitle}>{c.name}</div>
                <div className={`${styles.badge} ${badgeClass}`}>
                  {badgeLabel}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categorias</h1>
          <p className={styles.subtitle}>Gerencie como seus gastos são classificados</p>
        </div>
        
        <button className={styles.addBtn} onClick={handleOpenNew}>
          <AddRoundedIcon style={{ fontSize: 20 }} />
          Nova Categoria
        </button>
      </div>

      <div>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : (
          <>
            {renderGroup('Receitas', incomes, styles.income, 'Receita')}
            {renderGroup('Necessidades (50%)', needs, styles.expense, 'Necessidade')}
            {renderGroup('Desejos / Lazer (30%)', wants, styles.expense, 'Desejo / Lazer')}
            {renderGroup('Poupança / Investimentos (20%)', savings, styles.expense, 'Investimento')}
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Categoria' : 'Nova Categoria'}>
        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Nome</label>
            <input 
              required
              type="text" 
              className={formStyles.input}
              placeholder="Ex: Assinaturas"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className={formStyles.formRow}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Ícone</label>
              <select 
                className={formStyles.select}
                value={formData.icon}
                onChange={e => setFormData({...formData, icon: e.target.value})}
              >
                <option value="home">Casa / Moradia</option>
                <option value="utensils">Alimentação</option>
                <option value="car">Transporte</option>
                <option value="heart-pulse">Saúde</option>
                <option value="shopping-cart">Supermercado / Compras</option>
                <option value="paw-print">Pet</option>
                <option value="gamepad-2">Lazer</option>
                <option value="shirt">Vestuário</option>
                <option value="book-open">Educação</option>
                <option value="zap">Contas / Energia</option>
                <option value="trending-up">Investimentos</option>
                <option value="wallet">Salário / Carteira</option>
                <option value="briefcase">Trabalho / Freelance</option>
                <option value="money">Dinheiro</option>
                <option value="circle-ellipsis">Outros</option>
              </select>
            </div>
            
            <div className={formStyles.field}>
              <label className={formStyles.label}>Cor</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  required
                  type="color" 
                  className={formStyles.input}
                  style={{ padding: '2px', height: '42px', width: '42px', cursor: 'pointer' }}
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                />
                <input 
                  required
                  type="text" 
                  className={formStyles.input}
                  style={{ flex: 1 }}
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          <div className={formStyles.field} style={{ marginTop: 8 }}>
            <label className={formStyles.toggle}>
              <div className={`${formStyles.toggleSwitch} ${formData.isIncome ? formStyles.on : ''}`} />
              <input 
                type="checkbox"
                style={{ display: 'none' }}
                checked={formData.isIncome}
                onChange={e => setFormData({...formData, isIncome: e.target.checked})}
              />
              <span className={formStyles.toggleLabel}>É uma categoria de receita (entradas)</span>
            </label>
          </div>

          {!formData.isIncome && (
            <div className={formStyles.field}>
              <label className={formStyles.label}>Regra 50/30/20 (Classificação)</label>
              <select 
                className={formStyles.select}
                value={formData.ruleGroup}
                onChange={e => setFormData({...formData, ruleGroup: e.target.value as any})}
              >
                <option value="NEEDS">Necessidades (50%) - Moradia, contas básicas, mercado</option>
                <option value="WANTS">Desejos (30%) - Lazer, compras, assinaturas, viagens</option>
                <option value="SAVINGS">Poupança/Dívidas (20%) - Investimentos, reserva, empréstimos</option>
              </select>
            </div>
          )}

          <div className={formStyles.actions}>
            <button type="button" className={formStyles.btnSecondary} onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className={formStyles.btnPrimary}>
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
