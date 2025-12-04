import { XRay, VStack, HStack, Card, Text, Button } from './components';

export function Demo() {
  return (
    <XRay>
      <Card>
        <VStack gap="standard">
          <Text size="lg" weight="medium">User Profile</Text>
          <HStack gap="standard" align="center">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--gray-4)',
              }}
            />
            <VStack gap="tight">
              <Text weight="medium">Jane Doe</Text>
              <Text size="sm" muted>Product Designer</Text>
            </VStack>
          </HStack>
          <HStack gap="tight">
            <Button variant="primary" size="sm">Follow</Button>
            <Button variant="secondary" size="sm">Message</Button>
          </HStack>
        </VStack>
      </Card>
    </XRay>
  );
}
