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
    name: '硅碳摸鱼交流群',
    description: '硅碳摸鱼交流群',
    members: ['ai1', 'ai2', 'ai3']
  },
  {
    id: 'group2',
    name: '王海菊交流群',
    description: '王海菊交流群',
    members: ['ai4', 'ai5', 'ai6', 'ai7']
  }
];
