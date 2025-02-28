//这里配置群聊的信息
export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
}

export const groups: Group[] = [
  {
    id: 'group1',
    name: '王海菊交流群',
    description: '王海菊交流群',
    members: ['ai4', 'ai5', 'ai6']
  }
];
