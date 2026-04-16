import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  RefreshControl, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import ConfirmModal from '../../components/ui/ConfirmModal';
import MonthPicker from '../../components/ui/MonthPicker';
import ExpenseForm from '../../components/expenses/ExpenseForm';
import SpendTrendChart from '../../components/expenses/SpendTrendChart';
import CategoryBarChart from '../../components/expenses/CategoryBarChart';
import { listExpenses, createExpense, updateExpense, deleteExpense } from '../../db/expenses';
import { listCategories, createCategory } from '../../db/categories';
import { colors } from '../../constants/colors';
import type { Category, Expense, ExpenseCreate } from '../../types';

function toYearMonth(d: string) { return d.slice(0, 7); }
function fmt(n: number) { return `₹${Math.round(n).toLocaleString('en-IN')}`; }

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const scrollRef = useRef<InstanceType<typeof ScrollView>>(null);
  const currentMonth = toYearMonth(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [trendView, setTrendView] = useState<'total' | 'category'>('total');
  const [trendCategory, setTrendCategory] = useState('');

  async function load() {
    try {
      const e = await listExpenses();
      const c = await listCategories();
      setExpenses(e);
      setCategories(c);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    setCatLoading(true); setCatError('');
    try {
      await createCategory(newCatName.trim());
      setNewCatName(''); setShowNewCat(false);
      const cats = await listCategories();
      setCategories(cats);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Already exists');
    } finally { setCatLoading(false); }
  }

  const incomeRows = useMemo(() => expenses.filter((e) => e.category === 'income'), [expenses]);
  const spendRows = useMemo(() => expenses.filter((e) => e.category !== 'income'), [expenses]);

  const currentMonthSpend = useMemo(() =>
    spendRows.filter((e) => toYearMonth(e.date) === currentMonth)
      .reduce((s, e) => s + e.amount, 0), [spendRows, currentMonth]);

  const currentMonthIncome = useMemo(() =>
    incomeRows.filter((e) => toYearMonth(e.date) === currentMonth)
      .reduce((s, e) => s + e.amount, 0), [incomeRows, currentMonth]);

  const avgMonthlySpend = useMemo(() => {
    const byMonth: Record<string, number> = {};
    spendRows.forEach((e) => { const ym = toYearMonth(e.date); byMonth[ym] = (byMonth[ym] || 0) + e.amount; });
    const months = Object.values(byMonth);
    return months.length ? months.reduce((a, b) => a + b, 0) / months.length : 0;
  }, [spendRows]);

  const monthlyTrend = useMemo(() => {
    const byMonth: Record<string, number> = {};
    spendRows.forEach((e) => { const ym = toYearMonth(e.date); byMonth[ym] = (byMonth[ym] || 0) + e.amount; });
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([ym, total]) => {
      const [y, m] = ym.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
      return { label, total: Math.round(total) };
    });
  }, [spendRows]);

  const spendCategories = useMemo(() =>
    Array.from(new Set(spendRows.map((e) => e.category))).sort(), [spendRows]);

  const categoryTrend = useMemo(() => {
    if (!trendCategory) return [];
    const byMonth: Record<string, number> = {};
    spendRows.filter((e) => e.category === trendCategory).forEach((e) => {
      const ym = toYearMonth(e.date); byMonth[ym] = (byMonth[ym] || 0) + e.amount;
    });
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([ym, total]) => {
      const [y, m] = ym.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
      return { label, total: Math.round(total) };
    });
  }, [spendRows, trendCategory]);

  const monthOptions = useMemo(() => {
    const set = new Set(expenses.map((e) => toYearMonth(e.date)));
    set.add(currentMonth);
    return Array.from(set).sort().reverse();
  }, [expenses, currentMonth]);

  const monthSpendRows = useMemo(() =>
    spendRows.filter((e) => toYearMonth(e.date) === selectedMonth), [spendRows, selectedMonth]);

  const monthTotal = useMemo(() =>
    monthSpendRows.reduce((s, e) => s + e.amount, 0), [monthSpendRows]);

  const categoryTotals = useMemo(() => {
    const bycat: Record<string, number> = {};
    monthSpendRows.forEach((e) => { bycat[e.category] = (bycat[e.category] || 0) + e.amount; });
    return Object.entries(bycat).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
  }, [monthSpendRows]);

  const dailyRows = useMemo(() => {
    const byDay: Record<string, Expense[]> = {};
    monthSpendRows.forEach((e) => { byDay[e.date] = [...(byDay[e.date] || []), e]; });
    return Object.entries(byDay).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => ({
      date, items,
      total: items.reduce((s, e) => s + e.amount, 0),
    }));
  }, [monthSpendRows]);

  async function handleCreate(data: ExpenseCreate) { await createExpense(data); setShowForm(false); await load(); }
  async function handleUpdate(data: ExpenseCreate) {
    if (!editing) return;
    await updateExpense(editing.id, data); setEditing(null); await load();
  }
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteExpense(deleteTarget.id); setDeleteTarget(null); await load();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.indigo[500]} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Expenses</Text>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setShowNewCat(true); setShowForm(false); setEditing(null); }}>
              <Text style={styles.secondaryBtnText}>+ Category</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => { setShowForm(true); setShowNewCat(false); setEditing(null); }}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

        {/* New category form */}
        {showNewCat && (
          <Card>
            <Text style={styles.sectionTitle}>New Category</Text>
            <View style={{ marginTop: 12, gap: 10 }}>
              <TextInput
                style={styles.input}
                value={newCatName}
                onChangeText={setNewCatName}
                placeholder="e.g. subscriptions"
                placeholderTextColor={colors.gray[400]}
                autoCapitalize="none"
              />
              {!!catError && <Text style={styles.catError}>{catError}</Text>}
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowNewCat(false); setCatError(''); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBtn} onPress={handleCreateCategory} disabled={catLoading}>
                  {catLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.addBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}

        {/* Expense form */}
        {(showForm || editing) && (
          <Card>
            <Text style={styles.sectionTitle}>{editing ? 'Edit Expense' : 'New Expense'}</Text>
            <View style={{ marginTop: 12 }}>
              <ExpenseForm
                initial={editing ?? undefined}
                categories={categories}
                onSubmit={editing ? handleUpdate : handleCreate}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            </View>
          </Card>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="This month" value={fmt(currentMonthSpend)} />
          <StatCard label="Avg monthly" value={fmt(Math.round(avgMonthlySpend))} />
          <StatCard label="Income" value={fmt(currentMonthIncome)} valueColor={colors.green[600]} />
        </View>

        {/* Monthly trend */}
        {monthlyTrend.length > 1 && (
          <Card>
            <View style={styles.trendHeader}>
              <Text style={styles.sectionTitle}>Monthly spend trend</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, trendView === 'total' && styles.toggleBtnActive]}
                  onPress={() => setTrendView('total')}
                >
                  <Text style={[styles.toggleText, trendView === 'total' && styles.toggleTextActive]}>Total</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, trendView === 'category' && styles.toggleBtnActive]}
                  onPress={() => {
                    setTrendView('category');
                    if (!trendCategory && spendCategories.length) setTrendCategory(spendCategories[0]);
                  }}
                >
                  <Text style={[styles.toggleText, trendView === 'category' && styles.toggleTextActive]}>By category</Text>
                </TouchableOpacity>
              </View>
            </View>
            {trendView === 'category' && spendCategories.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {spendCategories.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catChip, trendCategory === c && styles.catChipActive]}
                      onPress={() => setTrendCategory(c)}
                    >
                      <Text style={[styles.catChipText, trendCategory === c && styles.catChipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            <View style={{ marginTop: 10 }}>
              <SpendTrendChart data={trendView === 'total' ? monthlyTrend : categoryTrend} />
            </View>
          </Card>
        )}

        {/* Monthly breakdown */}
        <Card>
          <View style={styles.breakdownHeader}>
            <Text style={styles.sectionTitle}>Monthly breakdown</Text>
            <MonthPicker options={monthOptions} value={selectedMonth} onChange={setSelectedMonth} />
          </View>

          {categoryTotals.length === 0 ? (
            <Text style={styles.emptyText}>No expenses for this month.</Text>
          ) : (
            <View style={{ marginTop: 14, gap: 14 }}>
              <CategoryBarChart data={categoryTotals} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{fmt(monthTotal)}</Text>
              </View>
              {/* Day-wise breakdown */}
              <Text style={[styles.sectionTitle, { fontSize: 13 }]}>Day-wise</Text>
              {dailyRows.map(({ date, items, total }) => (
                <View key={date} style={{ gap: 4 }}>
                  <View style={styles.dayHeaderRow}>
                    <Text style={styles.dayLabel}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </Text>
                    <Text style={styles.dayTotal}>{fmt(total)}</Text>
                  </View>
                  <View style={styles.dayItems}>
                    {items.map((e) => (
                      <View key={e.id} style={styles.expenseRow}>
                        <View style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          <Text style={styles.expenseCat}>{e.category}</Text>
                          {!!e.description && <Text style={styles.expenseDesc} numberOfLines={1}>{e.description}</Text>}
                        </View>
                        <Text style={styles.expenseAmt}>{fmt(e.amount)}</Text>
                        <TouchableOpacity onPress={() => { setEditing(e); setShowForm(false); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}>
                          <Text style={styles.editLink}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setDeleteTarget(e)}>
                          <Text style={styles.deleteLink}>Del</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete expense?"
        message={`Remove ₹${deleteTarget ? Math.round(deleteTarget.amount) : ''} (${deleteTarget?.category})?`}
        confirmLabel="Delete"
        confirmDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.gray[900] },
  headerBtns: { flexDirection: 'row', gap: 8 },
  addBtn: { backgroundColor: colors.indigo[600], paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  secondaryBtn: { borderWidth: 1, borderColor: colors.gray[300], backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  secondaryBtnText: { color: colors.gray[700], fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[700] },
  errorBox: { backgroundColor: colors.red[50], borderRadius: 8, padding: 12 },
  errorText: { fontSize: 13, color: colors.red[600] },
  input: { borderWidth: 1, borderColor: colors.gray[300], borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.gray[900], backgroundColor: colors.white },
  catError: { fontSize: 12, color: colors.red[600] },
  formActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { borderWidth: 1, borderColor: colors.gray[300], borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  cancelText: { fontSize: 14, color: colors.gray[700] },
  trendHeader: { gap: 10 },
  toggleRow: { flexDirection: 'row', borderWidth: 1, borderColor: colors.gray[200], borderRadius: 8, overflow: 'hidden', alignSelf: 'flex-start' },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.white },
  toggleBtnActive: { backgroundColor: colors.indigo[600] },
  toggleText: { fontSize: 13, color: colors.gray[600] },
  toggleTextActive: { color: colors.white, fontWeight: '600' },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.gray[200], backgroundColor: colors.white },
  catChipActive: { backgroundColor: colors.indigo[500], borderColor: colors.indigo[500] },
  catChipText: { fontSize: 12, color: colors.gray[700] },
  catChipTextActive: { color: colors.white },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.gray[100], paddingTop: 12 },
  totalLabel: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
  totalValue: { fontSize: 17, fontWeight: '700', color: colors.gray[900] },
  emptyText: { fontSize: 13, color: colors.gray[400], marginTop: 12 },
  dayHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayLabel: { fontSize: 11, fontWeight: '700', color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  dayTotal: { fontSize: 11, fontWeight: '700', color: colors.gray[700] },
  dayItems: { borderLeftWidth: 2, borderLeftColor: colors.indigo[100], paddingLeft: 10, gap: 1 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  expenseCat: { fontSize: 11, color: colors.indigo[500], textTransform: 'capitalize' },
  expenseDesc: { fontSize: 11, color: colors.gray[500], flex: 1 },
  expenseAmt: { fontSize: 12, fontWeight: '500', color: colors.gray[800] },
  editLink: { fontSize: 12, color: colors.indigo[600] },
  deleteLink: { fontSize: 12, color: colors.red[500] },
});
