// components/Layout/Breadcrumb.tsx
// 全局面包屑组件

import { Breadcrumb } from 'antd';
import { useLocation, Link } from 'react-router-dom';

const breadcrumbMap: Record<string, string> = {
  '/': '首页',
  '/questions': '题库',
  '/practice': '练习',
  '/stats': '统计',
  '/import': '录入题目',
};

export function BreadcrumbNav() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  // 特殊处理编辑页面
  if (pathnames[0] === 'questions' && pathnames[1]) {
    return (
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item>
          <Link to="/questions">题库</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>编辑题目</Breadcrumb.Item>
      </Breadcrumb>
    );
  }

  // 默认面包屑
  return (
    <Breadcrumb style={{ margin: '16px 0' }}>
      {pathnames.map((_, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = breadcrumbMap[to] || pathnames[index];

        return (
          <Breadcrumb.Item key={to}>
            {isLast ? (
              <span>{label}</span>
            ) : (
              <Link to={to}>{label}</Link>
            )}
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
}
