(() => {
  const API_URL = 'https://envanter360.vercel.app/api/superadmin/users/all';
  const tableBody = document.getElementById('users-table-body');
  const totalBadge = document.getElementById('users-total');
  const paginationInfo = document.getElementById('users-pagination-info');
  const roleDistributionList = document.getElementById('role-distribution-list');
  const statusDistributionList = document.getElementById('status-distribution-list');

  const setTableMessage = (message) => {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted py-4">${message}</td>
      </tr>
    `;
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return date.toLocaleDateString('tr-TR');
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeClass = (roleName = '') => {
    const normalized = roleName.toLowerCase();

    if (normalized.includes('superadmin')) return 'badge bg-label-danger';
    if (normalized.includes('yönetici') || normalized.includes('manager')) return 'badge bg-label-info';
    if (normalized.includes('birim')) return 'badge bg-label-primary';
    if (normalized.includes('personel') || normalized.includes('staff')) return 'badge bg-label-secondary';

    return 'badge bg-label-secondary';
  };

  const renderRoleDistribution = (users) => {
    roleDistributionList.innerHTML = '';

    const roleCounts = users.reduce((acc, user) => {
      const roleName = user.role_name || 'Rol belirtilmedi';
      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    }, {});

    if (Object.keys(roleCounts).length === 0) {
      roleDistributionList.innerHTML = '<li class="list-group-item text-muted">Rol bilgisi bulunamadı</li>';
      return;
    }

    Object.entries(roleCounts).forEach(([roleName, count]) => {
      const item = document.createElement('li');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';
      item.innerHTML = `${roleName} <span class="${getRoleBadgeClass(roleName)}">${count} kullanıcı</span>`;
      roleDistributionList.appendChild(item);
    });
  };

  const renderStatusDistribution = (users) => {
    statusDistributionList.innerHTML = '';

    const statusCounts = users.reduce(
      (acc, user) => {
        const statusKey = user.is_active === true ? 'Aktif' : user.is_active === false ? 'Pasif' : 'Beklemede';
        acc[statusKey] = (acc[statusKey] || 0) + 1;
        return acc;
      },
      {}
    );

    if (Object.keys(statusCounts).length === 0) {
      statusDistributionList.innerHTML = '<li class="list-group-item text-muted">Durum bilgisi bulunamadı</li>';
      return;
    }

    const badgeClasses = {
      Aktif: 'badge badge-light-success',
      Pasif: 'badge badge-light-secondary',
      Beklemede: 'badge badge-light-warning',
    };

    Object.entries(statusCounts).forEach(([status, count]) => {
      const item = document.createElement('li');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';
      const badgeClass = badgeClasses[status] || 'badge bg-label-secondary';
      item.innerHTML = `${status} <span class="${badgeClass}">${count}</span>`;
      statusDistributionList.appendChild(item);
    });
  };

  const renderUsers = (users) => {
    if (!Array.isArray(users) || users.length === 0) {
      totalBadge.textContent = 'Toplam: 0';
      paginationInfo.textContent = 'Gösterilen: 0 / 0';
      setTableMessage('Kullanıcı bulunamadı');
      renderRoleDistribution([]);
      renderStatusDistribution([]);
      return;
    }

    tableBody.innerHTML = '';

    users.forEach((user) => {
      const row = document.createElement('tr');
      row.dataset.userId = user.id;

      const statusBadge = user.is_active === false ? 'badge badge-light-secondary' : 'badge badge-light-success';
      const statusLabel = user.is_active === false ? 'Pasif' : 'Aktif';
      const roleName = user.role_name || 'Rol belirtilmedi';

      row.innerHTML = `
        <td>${user.id ?? '—'}</td>
        <td>${user.full_name || '—'}</td>
        <td>${user.email || '—'}</td>
        <td>${user.municipality_name || '—'}</td>
        <td><span class="${getRoleBadgeClass(roleName)}">${roleName}</span></td>
        <td><span class="${statusBadge}">${statusLabel}</span></td>
        <td>${formatDateTime(user.last_login_at)}</td>
        <td>${formatDate(user.created_at)}</td>
        <td class="d-flex gap-1">
          <a href="superadmin-user-detail.html?id=${user.id}" class="btn btn-sm btn-outline-primary" title="Detay">Detay</a>
          <a href="superadmin-user-edit.html?id=${user.id}" class="btn btn-sm btn-outline-secondary" title="Düzenle">Düzenle</a>
          <a href="superadmin-user-reset-password.html?id=${user.id}" class="btn btn-sm btn-outline-warning" title="Şifre Sıfırla">Şifre Sıfırla</a>
          <button type="button" class="btn btn-sm btn-outline-${user.is_active === false ? 'success' : 'danger'}" title="${user.is_active === false ? 'Aktif Yap' : 'Pasif Yap'}">${user.is_active === false ? 'Aktif Yap' : 'Pasif Yap'}</button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    totalBadge.textContent = `Toplam: ${users.length}`;
    paginationInfo.textContent = `Gösterilen: 1–${users.length} / ${users.length}`;

    renderRoleDistribution(users);
    renderStatusDistribution(users);
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_URL, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error('API isteği başarısız');
      }

      const data = await response.json();
      const users = Array.isArray(data) ? data : [];

      renderUsers(users);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata oluştu:', error);
      totalBadge.textContent = 'Toplam: 0';
      paginationInfo.textContent = 'Gösterilen: 0 / 0';
      setTableMessage('Kullanıcılar yüklenemedi');
      roleDistributionList.innerHTML = '<li class="list-group-item text-muted">Rol dağılımı hesaplanamadı</li>';
      statusDistributionList.innerHTML = '<li class="list-group-item text-muted">Durum dağılımı hesaplanamadı</li>';
    }
  };

  fetchUsers();
})();

