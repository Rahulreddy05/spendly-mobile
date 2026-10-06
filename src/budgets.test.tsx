import { Alert } from 'react-native';
import { fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { ApiError, currentMonth, formatMonth, shiftMonth } from '@rahulreddy05/spendly-shared';
import { fakeApi, fakeServices, renderWithProviders } from './test/render';
import { budget, budgetsResponse, notification } from './test/fixtures';
import { AddBudgetCard } from './components/AddBudgetCard';
import { BudgetCard } from './components/BudgetCard';
import type { AppServices } from './services/app-services';

let mockServices: AppServices;
jest.mock('./services/create-services', () => ({ createAppServices: () => mockServices }));

const APP_DIR = './src/app';
const THIS_MONTH = currentMonth();
const LAST_MONTH = shiftMonth(THIS_MONTH, -1);

const sample = [
  budget({
    category: 'GROCERIES',
    limitCents: 50_000,
    spentCents: 12_000,
    remainingCents: 38_000,
    usedPercent: 24,
    status: 'OK',
  }),
  budget({
    id: 'b2',
    category: 'DINING',
    limitCents: 30_000,
    spentCents: 24_000,
    remainingCents: 6_000,
    usedPercent: 80,
    status: 'WARNING',
  }),
  budget({
    id: 'b3',
    category: 'SHOPPING',
    limitCents: 10_000,
    spentCents: 12_500,
    remainingCents: -2_500,
    usedPercent: 125,
    status: 'EXCEEDED',
  }),
];

describe('Budgets tab', () => {
  it("shows this month's budgets with status, amounts and the total", async () => {
    const api = fakeApi({
      budgets: { list: jest.fn().mockResolvedValue(budgetsResponse(sample, THIS_MONTH)) },
    });
    mockServices = fakeServices({ api });
    renderRouter(APP_DIR, { initialUrl: '/budgets' });

    const dining = await screen.findByLabelText('Dining out budget');
    expect(api.budgets.list).toHaveBeenCalledWith(THIS_MONTH);
    expect(screen.getByLabelText(formatMonth(THIS_MONTH))).toBeTruthy();
    expect(
      screen.getByText(/You've spent \$485\.00 of \$900\.00 across your budgets/),
    ).toBeTruthy();
    expect(within(dining).getByText('$240.00 of $300.00')).toBeTruthy();
    expect(within(dining).getByText('Almost there · 80% used')).toBeTruthy();
    expect(within(dining).getByText('$60.00 left')).toBeTruthy();

    const shopping = screen.getByLabelText('Shopping budget');
    expect(
      within(shopping).getByRole('progressbar', { name: 'Shopping spending' }).props
        .accessibilityValue,
    ).toMatchObject({ now: 100 });
    expect(within(shopping).getByText('Over budget · 125% used')).toBeTruthy();
    expect(within(shopping).getByText('$25.00 over')).toBeTruthy();
  });

  it('steps back to a past month, read-only, and never into the future', async () => {
    const list = jest.fn(async (month?: string) =>
      budgetsResponse([budget()], month ?? THIS_MONTH),
    );
    mockServices = fakeServices({ api: fakeApi({ budgets: { list } }) });
    renderRouter(APP_DIR, { initialUrl: '/budgets' });

    expect(await screen.findByText('Add a budget')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));

    await waitFor(() => expect(list).toHaveBeenCalledWith(LAST_MONTH));
    await waitFor(() => expect(screen.queryByText('Add a budget')).toBeNull());
    expect(screen.queryByRole('button', { name: 'Change limit' })).toBeNull();
  });

  it('the bell opens notifications, and an alert opens budgets on its month', async () => {
    const api = fakeApi({
      notifications: {
        list: jest.fn().mockResolvedValue({
          unreadCount: 1,
          items: [
            notification({ data: { category: 'DINING', month: LAST_MONTH, threshold: 100 } }),
          ],
        }),
      },
    });
    mockServices = fakeServices({ api });
    renderRouter(APP_DIR, { initialUrl: '/' });

    fireEvent.press(await screen.findByRole('button', { name: 'Notifications, 1 unread' }));
    const alert = await screen.findByRole('button', { name: /Unread\. Dining out budget reached/ });
    expect(screen).toHavePathname('/notifications');
    fireEvent.press(alert);

    await waitFor(() => expect(screen).toHavePathname('/budgets'));
    expect(api.notifications.markRead).toHaveBeenCalledWith('n1');
    await waitFor(() => expect(api.budgets.list).toHaveBeenCalledWith(LAST_MONTH));
  });

  it('marks everything read, and explains an empty list', async () => {
    const api = fakeApi({
      notifications: {
        list: jest.fn().mockResolvedValue({ unreadCount: 3, items: [notification()] }),
      },
    });
    mockServices = fakeServices({ api });
    renderRouter(APP_DIR, { initialUrl: '/notifications' });

    fireEvent.press(await screen.findByRole('button', { name: 'Mark all as read' }));
    await waitFor(() => expect(api.notifications.markAllRead).toHaveBeenCalled());

    mockServices = fakeServices();
    screen.unmount();
    renderRouter(APP_DIR, { initialUrl: '/notifications' });
    expect(await screen.findByText(/No notifications yet/)).toBeTruthy();
  });

  it('shows the closest budgets on the dashboard, or invites setting one', async () => {
    const api = fakeApi({
      budgets: { list: jest.fn().mockResolvedValue(budgetsResponse(sample, THIS_MONTH)) },
    });
    mockServices = fakeServices({ api });
    renderRouter(APP_DIR, { initialUrl: '/' });

    const card = await screen.findByLabelText("This month's budgets");
    const bars = within(card).getAllByRole('progressbar');
    expect(bars.map((b) => b.props.accessibilityLabel)).toEqual([
      'Shopping spending',
      'Dining out spending',
      'Groceries spending',
    ]);
    fireEvent.press(within(card).getByRole('button', { name: 'See all budgets' }));
    await waitFor(() => expect(screen).toHavePathname('/budgets'));
  });

  it('turns budget alert emails off in Settings', async () => {
    const api = fakeApi({
      notifications: { updateSettings: jest.fn().mockResolvedValue({ budgetAlertEmail: false }) },
    });
    mockServices = fakeServices({ api });
    renderRouter(APP_DIR, { initialUrl: '/settings' });

    const toggle = await screen.findByLabelText('Email me budget alerts');
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent(toggle, 'valueChange', false);
    await waitFor(() =>
      expect(api.notifications.updateSettings).toHaveBeenCalledWith({ budgetAlertEmail: false }),
    );
  });
});

describe('AddBudgetCard', () => {
  it('offers only categories without a budget and validates the amount', async () => {
    const api = fakeApi({ budgets: { create: jest.fn().mockResolvedValue(budget()) } });
    renderWithProviders(<AddBudgetCard taken={['GROCERIES']} />, fakeServices({ api }));

    expect(screen.queryByRole('radio', { name: 'Groceries' })).toBeNull();
    fireEvent.press(screen.getByRole('radio', { name: 'Dining out' }));
    const field = screen.getByLabelText('Monthly limit for Dining out ($)');
    fireEvent.changeText(field, 'abc');
    fireEvent.press(screen.getByRole('button', { name: 'Add budget' }));
    expect(screen.getByText(/Enter an amount greater than \$0/)).toBeTruthy();
    expect(api.budgets.create).not.toHaveBeenCalled();

    fireEvent.changeText(field, '300');
    fireEvent.press(screen.getByRole('button', { name: 'Add budget' }));
    await waitFor(() =>
      expect(api.budgets.create).toHaveBeenCalledWith({ category: 'DINING', limitCents: 30_000 }),
    );
  });

  it('shows API errors, and says when every category has a budget', async () => {
    const api = fakeApi({
      budgets: {
        create: jest
          .fn()
          .mockRejectedValue(
            new ApiError(409, 'CONFLICT', 'You already have a budget for that category.'),
          ),
      },
    });
    const { unmount } = renderWithProviders(<AddBudgetCard taken={[]} />, fakeServices({ api }));
    fireEvent.press(screen.getByRole('radio', { name: 'Travel' }));
    fireEvent.changeText(screen.getByLabelText('Monthly limit for Travel ($)'), '100');
    fireEvent.press(screen.getByRole('button', { name: 'Add budget' }));
    expect(await screen.findByText('You already have a budget for that category.')).toBeTruthy();
    unmount();

    renderWithProviders(
      <AddBudgetCard
        taken={[
          'GROCERIES',
          'DINING',
          'SHOPPING',
          'TRAVEL',
          'TRANSPORT',
          'BILLS',
          'HOUSING',
          'ENTERTAINMENT',
          'HEALTH',
          'OTHER',
        ]}
      />,
    );
    expect(screen.getByText(/Every spending category has a budget/)).toBeTruthy();
  });
});

describe('BudgetCard', () => {
  it('changes the limit and removes the budget after confirming', async () => {
    const api = fakeApi({ budgets: { update: jest.fn().mockResolvedValue(budget()) } });
    const alert = jest.spyOn(Alert, 'alert');
    renderWithProviders(
      <BudgetCard budget={budget()} elapsed={0.5} editable />,
      fakeServices({ api }),
    );

    fireEvent.press(screen.getByRole('button', { name: 'Change limit' }));
    const field = screen.getByLabelText('New monthly limit ($)');
    expect(field.props.value).toBe('300');
    fireEvent.changeText(field, '0');
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter an amount greater than $0.')).toBeTruthy();
    fireEvent.changeText(field, '450.50');
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.budgets.update).toHaveBeenCalledWith('b1', 45_050));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy());
    fireEvent.press(screen.getByRole('button', { name: 'Remove' }));
    expect(alert).toHaveBeenCalledWith(
      'Remove your Dining out budget?',
      expect.any(String),
      expect.any(Array),
    );
    alert.mock.calls[0]![2]!.find((b) => b.style === 'destructive')!.onPress!();
    await waitFor(() => expect(api.budgets.remove).toHaveBeenCalledWith('b1'));
  });
});
