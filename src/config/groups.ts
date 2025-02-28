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
    name: '满眼都是竹',
    description: '满眼都是竹',
    members: ['ai4', 'ai6']
  }
];
